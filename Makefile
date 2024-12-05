NEEDS_SUDO := $(shell if [ "$$(uname)" = "Linux" ]; then echo "sudo"; fi)

DOCKER_COMPOSE     = docker compose -f compose.yml

all: load up

down:
	$(DOCKER_COMPOSE) down

clean_volume:
	$(DOCKER_COMPOSE) down -v

start:
	$(DOCKER_COMPOSE) start

build:
	$(DOCKER_COMPOSE) build

up: build
	$(DOCKER_COMPOSE) up

stop:
	$(DOCKER_COMPOSE) stop

clean: down
	docker container prune -f
	docker network prune -f
	docker image prune -f

fclean: clean clean_volume
	docker system prune -a -f

re: fclean all

.PHONY: all up down clean fclean re start stop

load:
	docker load < nginx.tar
	docker load < grafana.tar
	docker load < postgres_13.tar
	docker load < prometheus.tar
	docker load < python.tar
	docker load < cadvisor.tar