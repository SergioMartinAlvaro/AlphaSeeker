import json
import uuid

file_path = '/Users/sergiomartin/Desktop/FINANCIAL/AlphaSeeker/n8n-workflows/AI FINANCIAL_PRO.json'

with open(file_path, 'r') as f:
    workflow = json.load(f)

# 1. CLEANUP: Remove nodes added in previous step if they exist
nodes_to_remove = ["Generar Imagen y Estructura", "Guardar en Firestore"]
workflow['nodes'] = [n for n in workflow['nodes'] if n['name'] not in nodes_to_remove]
# Remove their connections
for key in list(workflow['connections'].keys()):
    if key in nodes_to_remove:
        del workflow['connections'][key]

# 2. DEFINE NEW NODES
# Node A: Construct URL with Style
style_node = {
    "parameters": {
        "jsCode": """
for (const item of items) {
  const llmResult = typeof item.json.result === 'string' ? JSON.parse(item.json.result) : item.json.result;
  const subjectPrompt = item.json.image_prompt || (llmResult ? llmResult.image_prompt : '') || 'Financial graph';
  
  // ENFORCED STYLE: Flat, Modern, Financial World
  const style = "flat vector art, modern corporate memphis style, financial technology aesthetic, minimalist, clean lines, vibrant blue and white colors, high quality";
  const fullPrompt = `${subjectPrompt}, ${style}`;
  
  const encodedPrompt = encodeURIComponent(fullPrompt);
  const seed = Math.floor(Math.random() * 10000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&seed=${seed}`;
  
  item.json = {
    ...item.json,
    ...llmResult,
    generated_image_url: imageUrl,
    temp_id: 'news_' + Math.floor(Math.random()*100000)
  };
}
return items;
"""
    },
    "name": "Definir Estilo y URL",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [450, 224],
    "id": str(uuid.uuid4())
}

# Node B: Download Image
download_node = {
    "parameters": {
        "url": "={{ $json.generated_image_url }}",
        "responseFormat": "file",
        "options": {}
    },
    "name": "Descargar Imagen",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.3,
    "position": [680, 224],
    "id": str(uuid.uuid4())
}

# Node C: Upload to GCS
gcs_node = {
    "parameters": {
        "operation": "upload",
        "bucketName": "alphaseeker-assets", # Fallback bucket
        "fileName": "={{ 'news-images/' + $json.temp_id + '.jpg' }}",
        "binaryData": True,
        "binaryPropertyName": "data",
        "options": {
            "predefinedAcl": "publicRead"
        }
    },
    "name": "Subir a GCS",
    "type": "n8n-nodes-base.googleCloudStorage",
    "typeVersion": 1,
    "position": [900, 224],
    "id": str(uuid.uuid4()),
    "credentials": {
        "googleCloudStorageOAuth2Api": {
            "id": "YOUR_GCS_CREDENTIAL_ID",
            "name": "Google Cloud Storage account"
        }
    }
}

# Node D: Save to Firestore (using Public URL from GCS)
firestore_node = {
    "parameters": {
        "operation": "create",
        "projectId": "alpha-seeker-finance",
        "collection": "news",
        "options": {}
    },
    "name": "Guardar en Firestore Final",
    "type": "n8n-nodes-base.googleFirebaseCloudFirestore",
    "typeVersion": 1,
    "position": [1120, 224],
    "id": str(uuid.uuid4()),
    # Using expression to map fields + GCS URL
    # Assuming GCS node output has 'mediaLink' or we construct public URL
    # Public URL pattern: https://storage.googleapis.com/BUCKET/FILE
    # But checking node output is safer. Let's assume standard object structure for now.
    "credentials": {
        "googleFirebaseCloudFirestoreApi": {
            "id": "YOUR_FIRESTORE_CREDENTIAL_ID",
            "name": "Google Firebase Cloud Firestore account"
        }
    }
}

# We need a Code node before Firestore to cleanup fields? 
# Firestore node "Columns" parameter allows auto-mapping.
# But we need to replace 'image_url' with the cloud storage one.
# GCS Node usually outputs metadata in JSON.
# Let's add a cleanup node.

cleanup_node = {
    "parameters": {
        "jsCode": """
for (const item of items) {
   // Construct Public URL (GCS 'publicRead' ACL makes this valid)
   const bucket = 'alphaseeker-assets';
   const filename = item.json.name; // 'name' is usually returned by GCS API inside json
   const publicUrl = `https://storage.googleapis.com/${bucket}/${filename}`;
   
   // Prepare final object
   item.json = {
       title: item.json.title || 'Market News',
       content_summary: item.json.content_summary || '',
       published_date: new Date().toISOString(),
       url: item.json.url || '',
       source: 'n8n',
       investment_advice: item.json.investment_advice || {},
       image_url: publicUrl
   };
}
return items;
"""
    },
    "name": "Preparar Objeto Final",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [1340, 224],
    "id": str(uuid.uuid4())
}

# Update Firestore node position
firestore_node['position'] = [1560, 224]


# 3. CONNECT THE NODES
# Re-find Split Out
split_out_id = next(n['name'] for n in workflow['nodes'] if n['name'] == 'Split Out')

workflow['connections'][split_out_id] = { "main": [[{ "node": style_node['name'], "type": "main", "index": 0 }]] }
workflow['connections'][style_node['name']] = { "main": [[{ "node": download_node['name'], "type": "main", "index": 0 }]] }
workflow['connections'][download_node['name']] = { "main": [[{ "node": gcs_node['name'], "type": "main", "index": 0 }]] }
workflow['connections'][gcs_node['name']] = { "main": [[{ "node": cleanup_node['name'], "type": "main", "index": 0 }]] }
workflow['connections'][cleanup_node['name']] = { "main": [[{ "node": firestore_node['name'], "type": "main", "index": 0 }]] }

# 4. APPEND NODES
workflow['nodes'].extend([style_node, download_node, gcs_node, cleanup_node, firestore_node])

with open(file_path, 'w') as f:
    json.dump(workflow, f, indent=2)

print("Workflow upgraded: Style Enforced -> Download -> Cloud Storage -> Firestore")
