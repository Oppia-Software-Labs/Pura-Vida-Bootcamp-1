# Bridge + modelo chess-vision (solo inferencia ONNX, sin torch).
# La cámara la abre el navegador y manda frames: Docker en macOS no ve cámaras USB.
# Build desde "Joaquin Pappa/":  docker compose -f vision-bridge/docker-compose.yml up --build
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 \
    VISION_DIR=/opt/vision BRIDGE_HOST=0.0.0.0

RUN pip install "python-chess>=1.10" "websockets>=15" "numpy>=1.24" \
    "onnxruntime>=1.16" "opencv-python-headless>=4.8"

COPY vision/chess_vision /opt/vision/chess_vision
COPY vision/models /opt/vision/models
COPY vision-bridge /opt/bridge
RUN pip install --no-deps /opt/bridge

EXPOSE 8765
CMD ["vision-bridge"]
