echo "Starting docker containers"
docker compose -f ./docker/docker-compose.yml up -d --build || exit 0
echo "Docker containers started"
echo "Building application"
export $(cat .env | xargs) && yarn run build || exit 0
echo "Starting application"
export $(cat .env | xargs) && yarn run dev || exit 0
echo "Application started"
