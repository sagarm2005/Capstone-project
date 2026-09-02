import os

import torch
from flask import Flask, jsonify, request
from PIL import Image
from torchvision import models, transforms

app = Flask(__name__)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "xray", "checkpoints", "binary", "densenet121.pt")

model = models.densenet121(weights=None)
model.classifier = torch.nn.Linear(model.classifier.in_features, 1)
checkpoint = torch.load(MODEL_PATH, map_location="cpu", weights_only=False)
model.load_state_dict(checkpoint["model_state_dict"])
model.eval()
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


@app.get("/healthz")
def healthz():
    return jsonify({"status": "ok", "model": "pneumonia"})


@app.post("/predict")
def predict():
    image_file = request.files.get("file")
    if not image_file or not image_file.filename:
        return jsonify({"error": "A chest X-ray image is required"}), 400
    try:
        image = Image.open(image_file.stream).convert("RGB")
        with torch.no_grad():
            score = float(torch.sigmoid(model(preprocess(image).unsqueeze(0))).item())
    except Exception:
        return jsonify({"error": "The Pneumonia model could not process this image"}), 422

    label = "Pneumonia" if score >= 0.5 else "Normal"
    confidence = score if label == "Pneumonia" else 1 - score
    return jsonify({
        "model": "Pneumonia Detection",
        "prediction": label,
        "confidence": round(confidence, 4),
        "disclaimer": "AI screening support only. A qualified clinician must make the final diagnosis.",
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("MODEL_PORT", "8000")), debug=False)
