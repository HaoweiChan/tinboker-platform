#!/usr/bin/env python3
"""
Firebase/Firestore Upload Service

This module handles uploading podcast episode data to Google Cloud Firestore.
"""

import os
import json
import re
import hashlib
from pathlib import Path
from typing import Optional, List, Dict
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    raise ImportError(
        "firebase-admin is required for Firebase upload functionality. "
        "Install it with: pip install firebase-admin"
    )

from src.models.podcast_models import PodcastEpisode, PodcastCollection


class FirebaseService:
    """
    Service for uploading podcast data to Google Cloud Firestore.
    """
    
    def __init__(self):
        """
        Initialize Firebase Admin SDK and Firestore client.
        
        Raises:
            ValueError: If required credentials are missing
            Exception: If Firebase initialization fails
        """
        self._initialize_firebase()
        self.db = self._get_firestore_client()
        self.collection_name = "podcasts"
        self.document_id = "podcast"
    
    def _initialize_firebase(self) -> None:
        """
        Initialize Firebase Admin SDK with credentials from environment variables.
        
        Raises:
            ValueError: If credentials are missing or invalid
            Exception: If initialization fails
        """
        # Check if Firebase app is already initialized
        try:
            firebase_admin.get_app()
            # App already initialized, skip
            return
        except ValueError:
            # App not initialized, proceed with initialization
            pass
        
        # Get credentials from environment
        credentials_path = os.getenv("GCP_CREDENTIALS_PATH")
        credentials_json = os.getenv("GCP_CREDENTIALS_JSON")
        
        if not credentials_path and not credentials_json:
            raise ValueError(
                "GCP_CREDENTIALS_PATH or GCP_CREDENTIALS_JSON is required. "
                "Set one of them in your .env file."
            )
        
        # Initialize credentials
        cred = None
        if credentials_path:
            # Use credentials from file path
            cred_path = Path(credentials_path).expanduser().resolve()
            if not cred_path.exists():
                raise FileNotFoundError(
                    f"Credentials file not found: {cred_path}"
                )
            cred = credentials.Certificate(str(cred_path))
        elif credentials_json:
            # Use credentials from JSON string
            try:
                if isinstance(credentials_json, str):
                    creds_dict = json.loads(credentials_json)
                else:
                    creds_dict = credentials_json
                cred = credentials.Certificate(creds_dict)
            except json.JSONDecodeError as e:
                raise ValueError(
                    f"Invalid JSON in GCP_CREDENTIALS_JSON: {e}"
                ) from e
        
        # Initialize Firebase Admin SDK
        try:
            firebase_admin.initialize_app(cred)
        except Exception as e:
            raise Exception(f"Failed to initialize Firebase Admin SDK: {e}") from e
    
    def _get_firestore_client(self) -> firestore.Client:
        """
        Get Firestore client, optionally with custom database ID.
        
        Returns:
            firestore.Client: Firestore client instance
            
        Note:
            The database must already exist in Google Cloud Console.
            Databases cannot be created programmatically - they must be created
            via Google Cloud Console or gcloud CLI.
        """
        database_id = os.getenv("FIRESTORE_DATABASE_ID")
        
        if database_id:
            # Use custom database ID (parameter name is 'database_id', not 'database')
            return firestore.client(database_id=database_id)
        else:
            # Use default database (default)
            return firestore.client()
    
    def upload_podcast_data(
        self,
        podcast_name: str,
        episode: PodcastEpisode,
        transcript_path: Optional[str] = None,
        summary_path: Optional[str] = None,
        svg_path: Optional[str] = None
    ) -> None:
        """
        Upload podcast episode data to Firestore.
        
        Each episode is stored as a separate document to avoid Firestore's 1MB document size limit.
        
        Structure:
        - Collection: `episodes`
        - Document ID: `{podcast_name}_{episode_title}` (sanitized)
        - Document data: Full episode data (transcript, summary, SVG, etc.)
        
        Args:
            podcast_name: Name of the podcast
            episode: PodcastEpisode object containing episode data
            transcript_path: Optional path to transcript file (for reference, not used)
            summary_path: Optional path to summary file (for reference, not used)
            svg_path: Optional path to SVG file (for reference, not used)
        
        Raises:
            Exception: If upload fails
        """
        try:
            # Generate a stable, unique episode ID
            # Use hash of podcast_name + episode_title + created_time for uniqueness
            episode_id = self._generate_episode_id(podcast_name, episode)
            print(f"  📝 Uploading episode with ID: {episode_id}")
            
            # Get reference to the episode document
            episodes_collection = self.db.collection("episodes")
            doc_ref = episodes_collection.document(episode_id)
            
            # Prepare episode data with episode_id included
            episode_data = episode.to_firestore_dict()
            episode_data['episode_id'] = episode_id  # Add episode_id to document for easy retrieval
            
            # Check if episode already exists
            existing_doc = doc_ref.get()
            if existing_doc.exists:
                print(f"  🔄 Updating existing episode document: {episode_id}")
                # Update existing episode (merge to preserve any additional fields)
                doc_ref.update(episode_data)
            else:
                print(f"  ✨ Creating new episode document: {episode_id}")
                # Create new episode document
                doc_ref.set(episode_data)
            
        except Exception as e:
            error_msg = str(e)
            # Provide helpful error message if database doesn't exist
            if "does not exist" in error_msg or "404" in error_msg:
                database_id = os.getenv("FIRESTORE_DATABASE_ID", "(default)")
                project_id = os.getenv("GCP_PROJECT_ID")
                if not project_id:
                    # Try to get project ID from credentials
                    try:
                        creds_path = os.getenv("GCP_CREDENTIALS_PATH")
                        if creds_path:
                            with open(creds_path, 'r') as f:
                                creds_data = json.load(f)
                                project_id = creds_data.get('project_id', 'your-project')
                    except:
                        project_id = 'your-project'
                
                raise Exception(
                    f"Firestore database '{database_id}' does not exist.\n"
                    f"Please create the database first:\n"
                    f"1. Go to: https://console.cloud.google.com/firestore/databases?project={project_id}\n"
                    f"2. Click 'Create Database'\n"
                    f"3. Choose 'Native mode' (recommended)\n"
                    f"4. Enter database ID: {database_id}\n"
                    f"5. Select location and click 'Create'\n\n"
                    f"Original error: {error_msg}"
                ) from e
            else:
                raise Exception(f"Failed to upload podcast data to Firestore: {e}") from e
    
    def _generate_episode_id(self, podcast_name: str, episode: PodcastEpisode) -> str:
        """
        Generate a stable, unique episode ID.
        
        Uses podcast_name + episode_title for stable matching with API episodes.
        Falls back to episode_number if title is missing, then to hash-based if both are missing.
        
        Args:
            podcast_name: Name of the podcast
            episode: PodcastEpisode object
            
        Returns:
            Stable episode ID (URL-friendly)
        """
        # Use hash of podcast name to handle non-ASCII characters (e.g., Chinese)
        # This ensures consistent, URL-friendly identifiers regardless of language
        podcast_hash = hashlib.sha256(podcast_name.encode('utf-8')).hexdigest()[:12]
        
        # Also try to get a readable prefix if possible (for English podcast names)
        # Sanitize podcast name for URL (keep only alphanumeric, underscore, hyphen)
        sanitized_podcast = re.sub(r'[^a-zA-Z0-9_-]', '', podcast_name)
        # If sanitized name is meaningful (has letters/numbers, not just underscores), use it
        if sanitized_podcast and len(sanitized_podcast) > 0 and not sanitized_podcast.replace('_', '').replace('-', '').strip() == '':
            # Use sanitized name if it has actual content
            podcast_prefix = sanitized_podcast[:30]  # Limit length
        else:
            # If sanitized name is empty or only special chars, use hash prefix
            podcast_prefix = podcast_hash[:8]
        
        # Prefer episode_title for stable matching (always available from API)
        if episode.episode_title:
            # Use hash of title to ensure consistent length and avoid issues with special chars
            title_hash = hashlib.sha256(episode.episode_title.encode('utf-8')).hexdigest()[:16]
            episode_id = f"{podcast_prefix}_{title_hash}"
            print(f"  🔑 Generated episode ID (from title): {episode_id}")
            return episode_id
        
        # Fallback to episode_number if title is missing
        if episode.episode_number is not None:
            episode_id = f"{podcast_prefix}_ep{episode.episode_number}"
            print(f"  🔑 Generated episode ID (from number): {episode_id}")
            return episode_id
        
        # Last resort: use timestamp hash
        timestamp = episode.created_time.isoformat() if hasattr(episode.created_time, 'isoformat') else str(episode.created_time)
        unique_string = f"{podcast_name}|{timestamp}"
        hash_obj = hashlib.sha256(unique_string.encode('utf-8'))
        hash_hex = hash_obj.hexdigest()[:16]
        episode_id = f"{podcast_prefix}_{hash_hex}"
        print(f"  🔑 Generated episode ID (from timestamp): {episode_id}")
        return episode_id
    
    def get_podcast_episodes(self, podcast_name: str, limit: Optional[int] = None, order_by: str = "created_time", descending: bool = True) -> List[Dict]:
        """
        Get all episodes for a specific podcast from Firestore.
        
        Args:
            podcast_name: Name of the podcast
            limit: Optional limit on number of episodes to return
            order_by: Field to sort by (default: "created_time")
            descending: Sort in descending order (default: True, newest first)
            
        Returns:
            List of episode dictionaries, sorted by created_time (newest first by default)
        """
        try:
            # Query episodes collection where podcast_name matches
            episodes_collection = self.db.collection("episodes")
            query = episodes_collection.where("podcast_name", "==", podcast_name)
            
            # Order by specified field
            direction = firestore.Query.DESCENDING if descending else firestore.Query.ASCENDING
            query = query.order_by(order_by, direction=direction)
            
            # Apply limit if specified
            if limit:
                query = query.limit(limit)
            
            episodes = []
            for doc in query.stream():
                episode_data = doc.to_dict()
                episode_data['id'] = doc.id  # Include document ID
                episodes.append(episode_data)
            
            return episodes
            
        except Exception as e:
            raise Exception(f"Failed to get podcast episodes from Firestore: {e}") from e
    
    def get_episode_by_id(self, episode_id: str) -> Optional[Dict]:
        """
        Get a single episode by its episode_id.
        
        Args:
            episode_id: The episode ID (document ID in Firestore)
            
        Returns:
            Episode dictionary if found, None otherwise
        """
        try:
            doc_ref = self.db.collection("episodes").document(episode_id)
            doc = doc_ref.get()
            
            if doc.exists:
                episode_data = doc.to_dict()
                episode_data['id'] = doc.id  # Include document ID
                return episode_data
            else:
                return None
                
        except Exception as e:
            raise Exception(f"Failed to get episode from Firestore: {e}") from e
    
    def get_all_podcasts(self) -> List[str]:
        """
        Get a list of all unique podcast names.
        
        Returns:
            List of podcast names (sorted alphabetically)
        """
        try:
            episodes_collection = self.db.collection("episodes")
            
            # Get all documents and extract unique podcast names
            podcast_names = set()
            for doc in episodes_collection.stream():
                episode_data = doc.to_dict()
                if episode_data and 'podcast_name' in episode_data:
                    podcast_names.add(episode_data['podcast_name'])
            
            return sorted(list(podcast_names))
            
        except Exception as e:
            raise Exception(f"Failed to get podcast list from Firestore: {e}") from e
    
    def get_existing_episode_titles(self, podcast_name: str) -> set:
        """
        Get set of episode titles that already exist in Firestore for a podcast.
        
        This is used for deduplication - only process episodes that don't exist yet.
        Uses episode_title as the primary matching field since it's always available.
        
        Args:
            podcast_name: Name of the podcast
            
        Returns:
            Set of episode titles (strings) that already exist
        """
        try:
            episodes_collection = self.db.collection("episodes")
            query = episodes_collection.where("podcast_name", "==", podcast_name)
            
            existing_titles = set()
            for doc in query.stream():
                episode_data = doc.to_dict()
                episode_title = episode_data.get('episode_title')
                if episode_title:
                    existing_titles.add(episode_title)
            
            return existing_titles
            
        except Exception as e:
            raise Exception(f"Failed to get existing episode titles from Firestore: {e}") from e
    
    def get_existing_episode_numbers(self, podcast_name: str) -> set:
        """
        Get set of episode numbers that already exist in Firestore for a podcast.
        
        This is used for additional deduplication matching (secondary to episode_title).
        
        Args:
            podcast_name: Name of the podcast
            
        Returns:
            Set of episode numbers (integers) that already exist
        """
        try:
            episodes_collection = self.db.collection("episodes")
            query = episodes_collection.where("podcast_name", "==", podcast_name)
            
            existing_numbers = set()
            for doc in query.stream():
                episode_data = doc.to_dict()
                episode_number = episode_data.get('episode_number')
                if episode_number is not None:
                    existing_numbers.add(int(episode_number))
            
            return existing_numbers
            
        except Exception as e:
            raise Exception(f"Failed to get existing episode numbers from Firestore: {e}") from e
    
    def episode_exists(self, podcast_name: str, episode_title: str, episode_number: Optional[int] = None) -> bool:
        """
        Check if a specific episode already exists in Firestore.
        
        This method queries by podcast_name and episode_title field, not by document ID,
        because older episodes may have hash-based document IDs. Querying by field ensures
        we find episodes regardless of their document ID format.
        
        Args:
            podcast_name: Name of the podcast
            episode_title: Episode title (always available from API)
            episode_number: Optional episode number (for additional matching if available)
            
        Returns:
            True if episode exists, False otherwise
        """
        try:
            # Query by podcast_name and episode_title (primary matching)
            episodes_collection = self.db.collection("episodes")
            query = episodes_collection.where("podcast_name", "==", podcast_name).where("episode_title", "==", episode_title)
            
            # If episode_number is provided, also filter by it for more precise matching
            if episode_number is not None:
                query = query.where("episode_number", "==", episode_number)
            
            # Check if any documents match
            docs = list(query.limit(1).stream())
            exists = len(docs) > 0
            if exists:
                doc_id = docs[0].id if docs else "N/A"
                print(f"  🔍 Found existing episode (ID: {doc_id})")
            else:
                print(f"  🔍 Episode not found in Firestore")
            return exists
            
        except Exception as e:
            raise Exception(f"Failed to check if episode exists in Firestore: {e}") from e

