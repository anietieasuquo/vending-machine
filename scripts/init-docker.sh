echo "Building application"
export $(cat .env | xargs) && yarn run clean:build || exit 0
echo "Application built"

echo "Starting docker containers"
docker compose up -d --build || exit 0
echo "Docker containers started"
echo "Opening Swagger UI"
sleep 3
open http://localhost:3000/api/v1/documentation
