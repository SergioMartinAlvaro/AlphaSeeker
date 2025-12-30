import requests
import sys

def test_scrape():
    url = "http://localhost:8080/scrape"
    # Use a known safe URL, e.g., example.com or a permissive news site
    # For this test, we'll try a generic one that usually allows bots or example.com
    target_url = "https://www.example.com" 
    
    payload = {"url": target_url}
    
    try:
        print(f"Testing scrape of {target_url}...")
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("Success!")
            print(f"Title: {data.get('title')}")
            print(f"Content length: {len(data.get('content', ''))}")
            if data.get('title') == "Example Domain":
                print("Verification Passed: Correct title found.")
            else:
                print("Verification Warning: Title mismatch (might be expected).")
        else:
            print(f"Failed with status {response.status_code}")
            print(response.text)
            sys.exit(1)
            
    except Exception as e:
        print(f"Error connecting to scraper: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_scrape()
