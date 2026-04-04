# Docker Guide - Backend MoMoney

Panduan ini berisi perintah Docker yang paling sering dipakai untuk menjalankan backend.

## Prasyarat

- Docker Desktop (Windows/macOS) atau Docker Engine (Linux) sudah terpasang.
- Jalankan command dari folder `backend/`.

Contoh masuk ke folder backend (PowerShell):

```powershell
cd d:\SOSKOD\kuliah\senpro\momoney\backend
```

## 1) Cara build backend pakai Docker

Build image dari `Dockerfile` backend:

```bash
docker build -t momoney-backend:latest .
```

Keterangan:

- `-t momoney-backend:latest` memberi nama image (`momoney-backend`) dan tag (`latest`).
- `.` berarti konteks build adalah folder saat ini (`backend/`).

Verifikasi hasil build:

```bash
docker images momoney-backend
```

## 2) Cara list Docker image

Menampilkan semua image:

```bash
docker images
```

Atau format ringkas:

```bash
docker image ls
```

## 3) Cara menambahkan image baru

Ada beberapa cara umum:

### Opsi A - Pull image dari Docker Hub

```bash
docker pull python:3.12-slim
```

### Opsi B - Build image baru dari Dockerfile lokal

```bash
docker build -t momoney-backend:v2 .
```

### Opsi C - Duplikasi tag image yang sudah ada

```bash
docker tag momoney-backend:latest momoney-backend:dev
```

## 4) Cara menghapus image

Hapus image berdasarkan nama:tag:

```bash
docker rmi momoney-backend:dev
```

Hapus image berdasarkan IMAGE ID:

```bash
docker rmi <IMAGE_ID>
```

Jika image masih dipakai container, hapus paksa:

```bash
docker rmi -f momoney-backend:dev
```

## 5) Cara run image Docker-nya

Jalankan container dari image backend:

```bash
docker run -d --name momoney-backend-container -p 8000:8000 --env-file .env momoney-backend:latest
```

Keterangan:

- `-d` menjalankan di background.
- `--name` memberi nama container.
- `-p 8000:8000` mapping port host ke container.
- `--env-file .env` memuat environment variable dari file `.env`.

Cek container yang berjalan:

```bash
docker ps
```

Lihat log container:

```bash
docker logs -f momoney-backend-container
```

Stop dan hapus container:

```bash
docker stop momoney-backend-container
docker rm momoney-backend-container
```

## Command tambahan yang berguna

Masuk ke shell container (jika image punya shell):

```bash
docker exec -it momoney-backend-container sh
```

List semua container (termasuk yang berhenti):

```bash
docker ps -a
```

Hapus image yang tidak terpakai:

```bash
docker image prune
```

Hapus semua object tidak terpakai (hati-hati):

```bash
docker system prune
```

## Alur cepat (ringkas)

1. Build image:

```bash
docker build -t momoney-backend:latest .
```

2. Jalankan container:

```bash
docker run -d --name momoney-backend-container -p 8000:8000 --env-file .env momoney-backend:latest
```

3. Cek status dan log:

```bash
docker ps
docker logs -f momoney-backend-container
```
