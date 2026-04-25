#!/usr/bin/env python3
"""
Script to check the subcollection structure of tickers and tags in Firestore.

The code uses subcollections:
- tickers/{ticker}/episodes/{episode_id}
- tags/{tag}/episodes/{episode_id}

So parent documents in tickers/tags collections might be empty but contain subcollections.
"""

import sys
from pathlib import Path
from typing import Dict, List, Any

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Add docs/podcast_related_files to path
docs_dir = Path(__file__).parent
sys.path.insert(0, str(docs_dir))

# Import podcast_models first and patch it into the module
import importlib.util
spec = importlib.util.spec_from_file_location("podcast_models", docs_dir / "podcast_models.py")
podcast_models = importlib.util.module_from_spec(spec)
spec.loader.exec_module(podcast_models)

# Create a mock src.models.podcast_models module
import types
mock_module = types.ModuleType('src.models.podcast_models')
mock_module.PodcastEpisode = podcast_models.PodcastEpisode
mock_module.PodcastCollection = podcast_models.PodcastCollection
sys.modules['src.models.podcast_models'] = mock_module

# Now import FirebaseService
from upload_to_firebase import FirebaseService


def check_subcollection_structure(service: FirebaseService, collection_name: str, limit: int = 10):
    """
    Check the subcollection structure for tickers or tags.
    
    Args:
        service: FirebaseService instance
        collection_name: 'tickers' or 'tags'
        limit: Maximum number of parent documents to check
    """
    print(f"\n{'='*80}")
    print(f"Checking '{collection_name}' collection structure")
    print(f"{'='*80}")
    
    try:
        collection_ref = service.db.collection(collection_name)
        
        # Get parent documents (tickers or tags)
        parent_docs = list(collection_ref.limit(limit).stream())
        
        print(f"\n📂 Found {len(parent_docs)} parent document(s) (showing up to {limit})")
        
        if not parent_docs:
            print(f"  ⚠️  No parent documents found in '{collection_name}' collection")
            return
        
        total_episodes = 0
        parent_docs_with_episodes = 0
        
        for i, parent_doc in enumerate(parent_docs, 1):
            parent_id = parent_doc.id
            parent_data = parent_doc.to_dict() or {}
            
            # Check subcollection
            episodes_subcollection = parent_doc.reference.collection("episodes")
            episode_docs = list(episodes_subcollection.limit(5).stream())
            
            print(f"\n  Parent Document {i}: '{parent_id}'")
            print(f"    Parent document fields: {list(parent_data.keys()) if parent_data else '(empty - just a container)'}")
            print(f"    Episodes in subcollection: {len(episode_docs)} (showing up to 5)")
            
            if episode_docs:
                parent_docs_with_episodes += 1
                total_episodes += len(episode_docs)
                
                # Show sample episode
                sample_episode = episode_docs[0].to_dict()
                print(f"    Sample episode data:")
                for key, value in sample_episode.items():
                    print(f"      - {key}: {value}")
            else:
                print(f"    ⚠️  No episodes in subcollection")
        
        # Get total count (approximate)
        print(f"\n📊 Summary:")
        print(f"  - Parent documents checked: {len(parent_docs)}")
        print(f"  - Parent documents with episodes: {parent_docs_with_episodes}")
        print(f"  - Total episodes found (sample): {total_episodes}")
        
        # Try to get a count of all parent documents
        try:
            all_parents = list(collection_ref.stream())
            print(f"  - Total parent documents in collection: {len(all_parents)}")
        except Exception as e:
            print(f"  - Could not count all documents: {e}")
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        import traceback
        traceback.print_exc()


def main():
    """Main function to check subcollection structure."""
    print("🔍 Checking tickers and tags subcollection structure in Firestore...")
    print("="*80)
    print("\nNote: The code uses subcollections:")
    print("  - tickers/{ticker}/episodes/{episode_id}")
    print("  - tags/{tag}/episodes/{episode_id}")
    print("\nParent documents may be empty containers, but contain subcollections.")
    
    try:
        # Initialize Firebase service
        service = FirebaseService()
        
        # Check tickers collection
        check_subcollection_structure(service, "tickers", limit=10)
        
        # Check tags collection
        check_subcollection_structure(service, "tags", limit=10)
        
        # Also check if we can use the get_episodes_by_ticker method
        print(f"\n{'='*80}")
        print("Testing get_episodes_by_ticker method")
        print(f"{'='*80}")
        
        try:
            # Get a sample ticker from episodes
            episodes = service.get_podcast_episodes(
                podcast_name=service.get_all_podcasts()[0] if service.get_all_podcasts() else None,
                limit=1
            )
            
            if episodes and episodes[0].get('related_tickers'):
                sample_ticker = episodes[0]['related_tickers'][0]
                print(f"\n📊 Testing with ticker: {sample_ticker}")
                ticker_episodes = service.get_episodes_by_ticker(sample_ticker, limit=5)
                print(f"  Found {len(ticker_episodes)} episode(s) via get_episodes_by_ticker()")
                if ticker_episodes:
                    print(f"  Sample episode: {ticker_episodes[0]}")
        except Exception as e:
            print(f"  ⚠️  Could not test get_episodes_by_ticker: {e}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

