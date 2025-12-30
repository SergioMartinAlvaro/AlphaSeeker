import json
import uuid

# Load the workflow
file_path = '/Users/sergiomartin/Desktop/FINANCIAL/AlphaSeeker/n8n-workflows/AI FINANCIAL_PRO.json'
with open(file_path, 'r') as f:
    workflow = json.load(f)

# Define new nodes
prepare_data_node = {
    "parameters": {
        "jsCode": """
for (const item of items) {
  const llmResult = typeof item.json.result === 'string' ? JSON.parse(item.json.result) : item.json.result;
  const rawPrompt = item.json.image_prompt || (llmResult ? llmResult.image_prompt : '') || 'Financial news';
  
  // Clean prompt if it's too long or messy, but for now take it.
  const shortPrompt = rawPrompt.length > 200 ? rawPrompt.substring(0, 200) : rawPrompt;
  const encodedPrompt = encodeURIComponent(shortPrompt + ' photorealistic, financial, cinematic lighting');
  const seed = Math.floor(Math.random() * 10000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&seed=${seed}`;
  
  // Update item.json to be the object we want to save
  item.json = {
    ...llmResult,
    image_url: imageUrl,
    published_date: new Date().toISOString(),
    source: 'n8n',
    title: item.json.title || 'Market Update', // Fallback if title lost
    url: item.json.url || ''
  };
}
return items;
"""
    },
    "name": "Generar Imagen y Estructura",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [
        450,
        224
    ],
    "id": str(uuid.uuid4())
}

firestore_node = {
    "parameters": {
        "operation": "create",
        "projectId": "alpha-seeker-finance",
        "collection": "news",
        "columns": "={{ Object.keys($json).join(',') }}",
        "options": {}
    },
    "name": "Guardar en Firestore",
    "type": "n8n-nodes-base.googleFirebaseCloudFirestore",
    "typeVersion": 1,
    "position": [
        680,
        224
    ],
    "id": str(uuid.uuid4()),
    "credentials": {
        "googleFirebaseCloudFirestoreApi": {
            "id": "YOUR_CREDENTIAL_ID_HERE",
            "name": "Google Firebase Cloud Firestore account"
        }
    }
}

# Find connection points
# Connect 'Split Out' to 'Generar Imagen y Estructura'
split_out_id = None
for node in workflow['nodes']:
    if node['name'] == 'Split Out':
        split_out_id = node['name']
        break

if split_out_id:
    workflow['connections'][split_out_id] = {
        "main": [
            [
                {
                    "node": "Generar Imagen y Estructura",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }

# Connect 'Generar Imagen y Estructura' to 'Guardar en Firestore'
workflow['connections'][prepare_data_node['name']] = {
    "main": [
        [
            {
                "node": "Guardar en Firestore",
                "type": "main",
                "index": 0
            }
        ]
    ]
}

# Add nodes
workflow['nodes'].append(prepare_data_node)
workflow['nodes'].append(firestore_node)

# Save
with open(file_path, 'w') as f:
    json.dump(workflow, f, indent=2)

print("Successfully updated workflow with Image Generation and Firestore nodes.")
