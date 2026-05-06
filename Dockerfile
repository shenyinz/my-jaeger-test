
# FROM python:3.9-slim
# WORKDIR /app
# RUN pip install fastapi uvicorn opentelemetry-api opentelemetry-sdk opentelemetry-instrumentation-fastapi opentelemetry-exporter-otlp
# COPY . .
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# # 使用轻量级 Python 镜像作为基础
# FROM python:3.9-slim

# # 设置工作目录
# WORKDIR /app

# # 先复制依赖文件并安装（利用 Docker 缓存层优化速度）
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# # 复制当前目录下的所有文件到容器中 (包括 main.py)
# COPY . .

# # 暴露端口
# EXPOSE 8000

# # 启动命令
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
# 1. Use lightweight image

FROM python:3.12-slim

# 2. Set working directory
WORKDIR /app

# 3. Copy and install dependencies first (leverage Docker cache layer to speed up subsequent builds)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy project code
COPY . .

# 5. Expose port (declaration only)
EXPOSE 8000

# 6. Start command
# Note: When starting with uvicorn, the host must be 0.0.0.0 to be accessible outside the container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]