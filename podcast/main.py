#!/usr/bin/env python3
"""
Main Pipeline Coordinator

This script coordinates the full podcast processing pipeline:
1. Download podcasts from podcasts_to_download.json
2. Transcribe downloaded audio files
3. Generate summaries and images
4. Upload processed data to Google Cloud Firestore
"""

import json
import sys
import argparse
import tempfile
from pathlib import Path
from typing import List, Dict, Optional

# Pull secrets from GSM before any module that reads os.getenv() at import time.
from src.secrets_bootstrap import bootstrap
bootstrap()

from src.service.download_podcasts import fetch_episodes, extract_podcast_id  # noqa: E402
from src.pipeline import PipelineConfig, EpisodeProcessor  # noqa: E402
from src.pipeline.steps import initialize_services  # noqa: E402


def load_podcasts_config(config_path: Path) -> List[Dict]:
    """
    Load podcast configuration from JSON file.
    
    Args:
        config_path: Path to podcasts_to_download.json
        
    Returns:
        List of podcast configurations
        
    Raises:
        FileNotFoundError: If config file doesn't exist
        json.JSONDecodeError: If JSON is invalid
    """
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")
    
    with open(config_path, 'r', encoding='utf-8') as f:
        podcasts = json.load(f)
    
    if not isinstance(podcasts, list):
        raise ValueError("Config file must contain a list of podcast objects")
    
    return podcasts


def create_podcast_config_mapping(config_path: Path) -> Dict[str, Dict]:
    """
    Create a mapping from podcast name to transcript_option from podcasts_to_download.json.
    
    Args:
        config_path: Path to podcasts_to_download.json
        
    Returns:
        Dictionary mapping podcast name to transcript_option dict
        Example: {"Gooaye 股癌": {"transcript_service": "groq", "model": "whisper-large-v3"}}
    """
    try:
        podcasts = load_podcasts_config(config_path)
        mapping = {}
        for podcast in podcasts:
            name = podcast.get('name')
            transcript_option = podcast.get('transcript_option')
            if name and transcript_option:
                mapping[name] = transcript_option
        return mapping
    except Exception as e:
        print(f"⚠ Warning: Could not load podcast config mapping: {e}")
        return {}


def run_pipeline(
    config_file: Path = Path("podcasts_to_download.json"),
    rerun_from: Optional[str] = None,
    transcript_service: str = "groq",
    use_file_mode: bool = False,
    reuse_existing_transcript: bool = False,
    episode_id: Optional[str] = None,
    fill_limit: bool = False,
) -> None:
    """
    Run the full podcast processing pipeline.
    
    Args:
        config_file: Path to podcasts_to_download.json
        rerun_from: Rerun from specific step ("download","transcribe", "summarize", "upload", "validate") or None for full pipeline
        transcript_service: Speech-to-text service to use ("whisper", "openai", or "groq")
        use_file_mode: If True, use file-based mode (default: streaming mode)
        reuse_existing_transcript: DEPRECATED - Legacy parameter, kept for backward compatibility. Use rerun_from="summarize" instead.
        episode_id: Optional episode ID to process a specific episode from Firestore (e.g., "Gooaye_0fc0dc362224cc2f")
    """
    print("=" * 60)
    print("Podcast Processing Pipeline")
    print("=" * 60)
    print(f"Config file: {config_file}")
    print(f"Transcript Service: {transcript_service}")
    print(f"Mode: {'File-based' if use_file_mode else 'Streaming'}")
    print(f"Rerun from: {rerun_from if rerun_from else 'Full pipeline'}")
    print(f"Reuse existing transcripts: {reuse_existing_transcript}")
    if episode_id:
        print(f"Episode ID: {episode_id} (fetching from Firestore)")
    print("=" * 60)
    
    # Create base config for service initialization
    base_config = PipelineConfig(
        config_file=config_file,
        podcast_name="",  # Will be set per podcast
        podcast_link="",  # Will be set per podcast
        stt_service_name=transcript_service,
        rerun_from=rerun_from,
        reuse_existing_transcript=reuse_existing_transcript,
        use_file_mode=use_file_mode,
        temp_dir=Path(tempfile.gettempdir()) / "podcast_downloader" if not use_file_mode else None
    )
    
    # Initialize services (all services must initialize successfully)
    print("\nInitializing services...")
    try:
        service_container = initialize_services(base_config)
        print("✓ All services initialized successfully\n")
    except Exception as e:
        print(f"\n✗ Fatal error: Service initialization failed")
        print(f"  {e}")
        print("\nPipeline terminated. Please fix the errors above and try again.")
        sys.exit(1)
    
    # Load podcast config mapping for transcript options
    podcast_config_mapping = create_podcast_config_mapping(config_file)
    
    # Load podcasts config early so it's available for process_firestore_episode
    # (needed when rerun_from == "download" to fetch episodeUrl from API)
    try:
        podcasts = load_podcasts_config(config_file)
    except Exception as e:
        print(f"⚠ Warning: Could not load podcasts config: {e}")
        podcasts = []
    
    # Helper function to process a single episode from Firestore
    def process_firestore_episode(firestore_episode: Dict, episode_id: str) -> bool:
        """Process a single episode fetched from Firestore."""
        # Extract podcast name from Firestore episode
        podcast_name = firestore_episode.get('podcast_name')
        if not podcast_name:
            print(f"✗ Error: Episode missing podcast_name field")
            return False
        
        # Get transcript_option from podcast config mapping, fallback to defaults
        transcript_option = podcast_config_mapping.get(podcast_name, {})
        episode_stt_service = transcript_option.get('transcript_service', transcript_service)
        episode_stt_model = transcript_option.get('model')  # Can be None to use default
        
        # Find podcast in config to get link and spotify_show_link
        podcast_json_config = None
        for podcast in podcasts:
            if podcast.get('name') == podcast_name:
                podcast_json_config = podcast
                break
        
        episode_spotify_show_link = None
        if podcast_json_config:
            episode_spotify_show_link = podcast_json_config.get('spotify_show_link')
        else:
            # Debug: Show available podcast names if not found
            available_names = [p.get('name') for p in podcasts]
            print(f"  ⚠ Debug: Podcast '{podcast_name}' not found in config")
            print(f"  ⚠ Debug: Available podcasts in config: {available_names}")
        
        print(f"  📋 Podcast: {podcast_name}")
        print(f"  🔧 STT Service: {episode_stt_service}" + (f" (Model: {episode_stt_model})" if episode_stt_model else " (default model)"))
        if episode_spotify_show_link:
            print(f"  🎵 Spotify Show Link: {episode_spotify_show_link}")
        else:
            if podcast_json_config:
                print(f"  🎵 Spotify: Not configured (podcast found in config but no spotify_show_link)")
            else:
                print(f"  🎵 Spotify: Not configured (podcast not found in config)")
        
        # Create api_episode_data dict from Firestore data (minimal structure needed for processor)
        api_episode_data = {
            'title': firestore_episode.get('episode_title', ''),
            'episodeNumber': firestore_episode.get('episode_number'),
            # Add any other fields that might be needed
        }
        
        # If rerun_from == "download", fetch episode from API to get episodeUrl
        if rerun_from == "download":
            episode_title = firestore_episode.get('episode_title', '')
            
            if podcast_json_config and podcast_json_config.get('link'):
                try:
                    # Extract podcast ID and fetch episodes from API
                    from src.service.download_podcasts import extract_podcast_id, fetch_episodes
                    podcast_id = extract_podcast_id(podcast_json_config['link'])
                    api_episodes = fetch_episodes(podcast_id)
                    
                    # Find matching episode by title
                    for api_episode in api_episodes:
                        if api_episode.get('title') == episode_title:
                            api_episode_data['episodeUrl'] = api_episode.get('episodeUrl')
                            print(f"  ✓ Found episode in API, using original download URL")
                            break
                    
                    if not api_episode_data.get('episodeUrl'):
                        print(f"  ⚠ Warning: Episode '{episode_title}' not found in API, cannot download from original source")
                except Exception as e:
                    print(f"  ⚠ Warning: Failed to fetch episode from API: {e}")
            else:
                print(f"  ⚠ Warning: Podcast '{podcast_name}' not found in config or missing link, cannot fetch episodeUrl from API")
        
        # Create podcast-specific config with transcript options from config file
        podcast_config = PipelineConfig(
            config_file=config_file,
            podcast_name=podcast_name,
            podcast_link="",  # Not needed when fetching from Firestore
            spotify_show_link=episode_spotify_show_link,  # Load from config
            episode_limit=1,
            stt_service_name=episode_stt_service,
            stt_model=episode_stt_model,  # Use model from config if available
            rerun_from=rerun_from,
            reuse_existing_transcript=reuse_existing_transcript,
            use_file_mode=use_file_mode,
            temp_dir=base_config.temp_dir
        )
        
        # Create processor with service container
        processor = EpisodeProcessor(podcast_config, service_container)
        
        # Create EpisodeData and populate from Firestore episode data
        from src.pipeline.episode_data import EpisodeData
        from src.pipeline.utils import determine_language
        episode_data = EpisodeData(
            api_data=api_episode_data,
            podcast_name=podcast_name,
            language=determine_language(podcast_name)
        )
        episode_data.episode_id = episode_id
        
        # Load GCS URLs
        if firestore_episode.get('mp3_url') or firestore_episode.get('transcript_url'):
            if rerun_from == "summarize":
                # For summarize rerun, only load MP3 and transcript URLs
                episode_data.gcs_urls = {
                    'mp3_url': firestore_episode.get('mp3_url'),
                    'transcript_url': firestore_episode.get('transcript_url'),
                    'mp3_public_url': firestore_episode.get('mp3_public_url'),
                    'transcript_public_url': firestore_episode.get('transcript_public_url'),
                }
            else:
                # For other modes, load all URLs
                episode_data.gcs_urls = {
                    'mp3_url': firestore_episode.get('mp3_url'),
                    'transcript_url': firestore_episode.get('transcript_url'),
                    'summary_url': firestore_episode.get('summary_url'),
                    'summary_image_url': firestore_episode.get('summary_image_url'),
                    'mp3_public_url': firestore_episode.get('mp3_public_url'),
                    'transcript_public_url': firestore_episode.get('transcript_public_url'),
                    'summary_public_url': firestore_episode.get('summary_public_url'),
                    'summary_image_public_url': firestore_episode.get('summary_image_public_url'),
                    'events_markdown_url': firestore_episode.get('events_markdown_url'),
                    'events_markdown_public_url': firestore_episode.get('events_markdown_public_url'),
                    'sentences_markdown_url': firestore_episode.get('sentences_markdown_url'),
                    'sentences_markdown_public_url': firestore_episode.get('sentences_markdown_public_url'),
                    'pptx_url': firestore_episode.get('pptx_url'),
                    'pptx_public_url': firestore_episode.get('pptx_public_url'),
                    'marp_markdown_url': firestore_episode.get('marp_markdown_url'),
                    'marp_markdown_public_url': firestore_episode.get('marp_markdown_public_url'),
                    'ticker_recommendations_url': firestore_episode.get('ticker_recommendations_url'),
                    'ticker_recommendations_public_url': firestore_episode.get('ticker_recommendations_public_url'),
                    'ticker_marp_markdown_url': firestore_episode.get('ticker_marp_markdown_url'),
                    'ticker_marp_markdown_public_url': firestore_episode.get('ticker_marp_markdown_public_url'),
                }
        
        # Load Spotify metadata if available
        if firestore_episode.get('spotify_id'):
            episode_data.spotify_metadata = {
                'spotify_id': firestore_episode.get('spotify_id'),
                'spotify_url': firestore_episode.get('spotify_url'),
                'spotify_embed_url': firestore_episode.get('spotify_embed_url'),
                'release_date': firestore_episode.get('spotify_release_date'),
                'description': firestore_episode.get('spotify_description'),
                'duration_ms': firestore_episode.get('spotify_duration_ms'),
                'images': firestore_episode.get('spotify_images', []),
            }
        
        # Load created_time if available
        if firestore_episode.get('created_time'):
            from datetime import datetime
            created_time = firestore_episode.get('created_time')
            if isinstance(created_time, str):
                episode_data.created_time = datetime.fromisoformat(created_time)
            elif isinstance(created_time, datetime):
                episode_data.created_time = created_time
        
        # For rerun_from="summarize", download transcript from GCS
        if rerun_from == "summarize" and service_container.gcs_service:
            transcript_url = firestore_episode.get('transcript_url')
            if transcript_url:
                try:
                    transcript_data = service_container.gcs_service.download_transcript_by_gcs_url(transcript_url)
                    if transcript_data and transcript_data.get('text'):
                        episode_data.transcript_text = transcript_data.get('text', '')
                        episode_data.transcript_words = transcript_data.get('words')
                        sentences_data = transcript_data.get('sentences', [])
                        if sentences_data:
                            from src.models.podcast_models import Sentence
                            episode_data.transcript_sentences = [
                                Sentence(**s) if isinstance(s, dict) else s
                                for s in sentences_data
                            ]
                        print(f"  ♻ Loaded transcript from GCS ({len(episode_data.transcript_text):,} characters)")
                        if episode_data.transcript_sentences:
                            print(f"  ♻ Sentence-level timing available ({len(episode_data.transcript_sentences)} sentences)")
                except Exception as e:
                    print(f"  ⚠ Warning: Could not download transcript from GCS: {e}")
        
        # Process the episode
        print(f"\nProcessing episode: {api_episode_data.get('title', 'Unknown')}")
        return processor.process_episode(api_episode_data)
    
    # If episode_id is provided, fetch directly from Firestore
    if episode_id:
        if not service_container.firebase_service:
            print(f"✗ Error: Cannot fetch episode from Firestore without Firebase service")
            sys.exit(1)
        
        try:
            if episode_id.lower() == "all":
                # Fetch all episodes from Firestore
                print(f"Fetching all episodes from Firestore...")
                all_episodes = service_container.firebase_service.get_all_episodes()
                
                if not all_episodes:
                    print(f"✗ No episodes found in Firestore")
                    sys.exit(1)
                
                print(f"✓ Found {len(all_episodes)} episode(s) in Firestore\n")
                
                # Process each episode
                success_count = 0
                error_count = 0
                
                for idx, firestore_episode in enumerate(all_episodes, 1):
                    episode_id_from_firestore = firestore_episode.get('id')
                    episode_title = firestore_episode.get('episode_title', 'Unknown')
                    
                    print(f"\n{'='*60}")
                    print(f"Episode {idx}/{len(all_episodes)}: {episode_title}")
                    print(f"Episode ID: {episode_id_from_firestore}")
                    print(f"{'='*60}")
                    
                    try:
                        success = process_firestore_episode(firestore_episode, episode_id_from_firestore)
                        if success:
                            success_count += 1
                            print(f"✓ Episode {idx} processed successfully")
                        else:
                            error_count += 1
                            print(f"✗ Episode {idx} failed")
                    except Exception as e:
                        error_count += 1
                        print(f"✗ Error processing episode {idx}: {e}")
                        import traceback
                        traceback.print_exc()
                
                # Summary
                print(f"\n{'='*60}")
                print(f"Processing Summary")
                print(f"{'='*60}")
                print(f"Total episodes: {len(all_episodes)}")
                print(f"Successful: {success_count}")
                print(f"Failed: {error_count}")
                print(f"{'='*60}")
                
                if error_count > 0:
                    sys.exit(1)
            else:
                # Fetch single episode
                print(f"Fetching episode {episode_id} from Firestore...")
                firestore_episode = service_container.firebase_service.get_episode_by_id(episode_id)
                if not firestore_episode:
                    print(f"✗ Episode not found in Firestore: {episode_id}")
                    sys.exit(1)
                
                print(f"✓ Found episode: {firestore_episode.get('episode_title', 'Unknown')}")
                
                success = process_firestore_episode(firestore_episode, episode_id)
                
                if success:
                    print("\n" + "=" * 60)
                    print("Pipeline completed successfully!")
                    print("=" * 60)
                else:
                    print("\n" + "=" * 60)
                    print("Pipeline completed with errors")
                    print("=" * 60)
                    sys.exit(1)
            
            return
        except Exception as e:
            print(f"✗ Error fetching/processing episode from Firestore: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
    
    # Normal flow: Process podcasts from API
    # (podcasts config already loaded earlier for process_firestore_episode)
    if not podcasts:
        try:
            podcasts = load_podcasts_config(config_file)
            print(f"Found {len(podcasts)} podcast(s) to process\n")
        except Exception as e:
            print(f"✗ Error loading config: {e}")
            sys.exit(1)
    else:
        print(f"Found {len(podcasts)} podcast(s) to process\n")
    
    # Create temp directory for downloads (streaming mode)
    if not use_file_mode:
        temp_dir = Path(tempfile.gettempdir()) / "podcast_downloader"
        temp_dir.mkdir(parents=True, exist_ok=True)
        base_config.temp_dir = temp_dir
    
    # Process each podcast
    for podcast in podcasts:
        name = podcast.get('name')
        link = podcast.get('link')
        limit = podcast.get('limit', 2)  # Default to 2 for cron service
        spotify_show_link = podcast.get('spotify_show_link')  # Optional Spotify link
        transcript_option = podcast.get('transcript_option', {})  # Optional transcript options
        
        if not name or not link:
            print(f"⚠ Warning: Skipping invalid podcast entry (missing 'name' or 'link')")
            continue
        
        # Extract transcript service and model from transcript_option (if provided)
        # Otherwise use command-line/default values
        podcast_transcript_service = transcript_option.get('transcript_service', transcript_service)
        podcast_transcript_model = transcript_option.get('model', None)
        
        print(f"\n{'='*60}")
        print(f"Processing: {name}")
        print(f"URL: {link}")
        print(f"Limit: {limit} episodes")
        if transcript_option:
            print(f"Transcript Service: {podcast_transcript_service}")
            if podcast_transcript_model:
                print(f"Transcript Model: {podcast_transcript_model}")
        print(f"{'='*60}")
        
        try:
            # Extract podcast ID
            podcast_id = extract_podcast_id(link)
            if not podcast_id or podcast_id.strip() == '':
                print(f"✗ Error: Invalid podcast ID extracted from URL: {link}")
                continue
            
            # Fetch episodes from API
            print("Fetching episode list from API...")
            episodes = fetch_episodes(podcast_id)
            
            if not episodes:
                print("✗ No episodes found or error fetching episodes")
                continue
            
            print(f"Found {len(episodes)} episodes from API")
            
            # Apply limit based on fill_limit mode
            if fill_limit:
                # Filter out processed episodes
                # Note: fetch_episodes already returns all episodes, so we check them in order
                # but stop once we find enough non-processed ones
                total_episodes = len(episodes)
                non_processed_episodes = []
                checked_count = 0
                for episode in episodes:
                    checked_count += 1
                    # Check if episode is already processed
                    if service_container.firebase_service:
                        existing = service_container.firebase_service.get_episode_by_fields(
                            podcast_name=name,
                            episode_title=episode.get('title'),
                            episode_number=episode.get('episodeNumber')
                        )
                        # If not found with podcast_name, try without it (in case podcast_name is empty in Firestore)
                        if not existing:
                            existing = service_container.firebase_service.get_episode_by_title_and_number(
                                episode_title=episode.get('title'),
                                episode_number=episode.get('episodeNumber')
                            )
                        # Check if fully processed (has all required URLs)
                        if existing and existing.get('mp3_url') and existing.get('transcript_url') and existing.get('summary_url') and existing.get('summary_image_url'):
                            continue  # Skip processed episode
                    non_processed_episodes.append(episode)
                    if len(non_processed_episodes) >= limit:
                        break
                
                episodes = non_processed_episodes
                print(f"Found {len(non_processed_episodes)} non-processed episodes (checked {checked_count} out of {total_episodes} total)")
            else:
                # Normal flow: just take latest N episodes
                if limit and limit > 0:
                    episodes = episodes[:limit]
                    print(f"Limited to latest {len(episodes)} episodes")
            
            # Create podcast-specific config
            podcast_config = PipelineConfig(
                config_file=config_file,
                podcast_name=name,
                podcast_link=link,
                spotify_show_link=spotify_show_link,
                episode_limit=limit,
                stt_service_name=podcast_transcript_service,
                stt_model=podcast_transcript_model,
                rerun_from=rerun_from,
                reuse_existing_transcript=reuse_existing_transcript,
                use_file_mode=use_file_mode,
                fill_limit=fill_limit,
                temp_dir=base_config.temp_dir
            )
            
            # Create processor with service container
            processor = EpisodeProcessor(podcast_config, service_container)
            
            # Process each episode
            if not episodes:
                print("No episodes to process")
                continue
            
            successful = 0
            failed = 0
            
            for i, api_episode_data in enumerate(episodes, 1):
                success = processor.process_episode(api_episode_data)
                if success:
                    successful += 1
                else:
                    failed += 1
            
            print(f"\nSummary for {name}:")
            print(f"  Successful: {successful}")
            print(f"  Failed: {failed}")
            print(f"  Total: {len(episodes)}")
            
        except Exception as e:
            print(f"✗ Error processing podcast {name}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    # Clean up temp directory (streaming mode)
    if not use_file_mode and base_config.temp_dir and base_config.temp_dir.exists():
        try:
            # Remove all files in temp dir
            for file in base_config.temp_dir.glob("*"):
                if file.is_file():
                    file.unlink()
            # Note: We don't remove the directory itself as it might be in use
        except Exception as e:
            print(f"⚠ Warning: Failed to clean up temp directory: {e}")
    
    print("\n" + "=" * 60)
    print("Pipeline completed!")
    print("=" * 60)


def main():
    """Main function with command-line argument parsing."""
    parser = argparse.ArgumentParser(
        description="Podcast processing pipeline: download, transcribe, summarize, and upload to Firebase"
    )
    
    parser.add_argument(
        "--config",
        type=str,
        default="podcasts_to_download.json",
        help="Path to podcasts configuration JSON file (default: podcasts_to_download.json)"
    )
    
    parser.add_argument(
        "--rerun-from",
        type=str,
        choices=["download", "transcribe", "summarize", "upload", "validate"],
        default=None,
        help="Rerun pipeline from specific step. Options: download (download MP3 and rerun all steps, treating each episode as new), transcribe (download MP3 then rerun from transcribe), summarize (download transcript then rerun from summarize), upload (rerun only upload steps), validate (only validate). Default: None (full pipeline)"
    )
    
    parser.add_argument(
        "--transcript-service",
        type=str,
        choices=["whisper", "openai", "groq"],
        default="groq",
        dest="transcript_service",
        help="Speech-to-text service to use: 'whisper' or 'openai' (both use OpenAI Whisper API), or 'groq' (uses Groq Whisper API). Default: groq"
    )
    
    parser.add_argument(
        "--file-mode",
        action="store_true",
        help="Use file-based mode instead of streaming mode (default: streaming mode)"
    )
    
    parser.add_argument(
        "--episode",
        type=str,
        default=None,
        help="Process episode(s) from Firestore. Specify episode ID (e.g., 'Gooaye_0fc0dc362224cc2f') or 'all' to process all episodes. Fetches episode data and GCS files directly, bypassing API. Transcript options are read from podcasts_to_download.json based on podcast_name."
    )
    
    parser.add_argument(
        "--fill-limit",
        action="store_true",
        help="Skip already-processed episodes and process exactly 'limit' number of non-processed episodes"
    )
    
    args = parser.parse_args()
    
    try:
        run_pipeline(
            config_file=Path(args.config),
            rerun_from=args.rerun_from,
            transcript_service=args.transcript_service,
            use_file_mode=args.file_mode,
            reuse_existing_transcript=False,  # DEPRECATED: Legacy flag, kept for backward compatibility
            episode_id=args.episode,
            fill_limit=args.fill_limit,
        )
    except KeyboardInterrupt:
        print("\n\nPipeline interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

