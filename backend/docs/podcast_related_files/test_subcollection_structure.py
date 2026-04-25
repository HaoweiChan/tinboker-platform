#!/usr/bin/env python3
"""
Test script to check the actual subcollection structure in Firestore.
"""

import sys
from pathlib import Path

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
from firebase_admin import firestore

fs = FirebaseService()

# Check what's actually in the database
print('Checking actual data structure in Firestore...')
print()

# Direct query to see what's stored
ticker_ref = fs.db.collection('tickers').document('orcl').collection('episodes')
docs = list(ticker_ref.limit(1).stream())

if docs:
    doc = docs[0]
    data = doc.to_dict()
    print('Sample document from tickers/orcl/episodes:')
    for key, value in data.items():
        print(f'  {key}: {value} (type: {type(value).__name__})')
    print()
    
    # Check if created_time is datetime or string
    if 'created_time' in data:
        ct = data['created_time']
        print(f'created_time type: {type(ct).__name__}')
        if hasattr(ct, 'isoformat'):
            print(f'created_time value: {ct.isoformat()}')
        else:
            print(f'created_time value: {ct}')
else:
    print('No documents found in tickers/orcl/episodes')
    print()
    
    # Check if parent document exists
    parent_doc = fs.db.collection('tickers').document('orcl').get()
    if parent_doc.exists:
        print('Parent document tickers/orcl exists but is empty (container only)')
        parent_data = parent_doc.to_dict()
        print(f'Parent document data: {parent_data}')
    else:
        print('Parent document tickers/orcl does not exist')
    
    # Try to find any ticker that has episodes
    print()
    print('Searching for any ticker with episodes...')
    tickers_collection = fs.db.collection('tickers')
    all_tickers = list(tickers_collection.limit(10).stream())
    
    if all_tickers:
        print(f'Found {len(all_tickers)} ticker parent documents')
        for ticker_doc in all_tickers:
            ticker_id = ticker_doc.id
            episodes_ref = ticker_doc.reference.collection('episodes')
            episode_count = len(list(episodes_ref.limit(1).stream()))
            if episode_count > 0:
                print(f'  {ticker_id}: Has {episode_count}+ episodes')
                # Get sample
                sample = list(episodes_ref.limit(1).stream())[0]
                print(f'    Sample episode data: {sample.to_dict()}')
                break
        else:
            print('  No tickers found with episodes in subcollections')
    else:
        print('No ticker parent documents found at all')

