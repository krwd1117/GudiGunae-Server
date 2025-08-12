# Docker 

## Docker를 활용한 서버 빌드 명령어
``` bash
docker build -t gudigunae-server .
```

## Docker를 활용한 서버 자동 실행 명령어
[포트 번호] 대신 실제 운영중인 포트의 번호를 입력해야 함
``` bash
docker run -d -p [포트 번호] --restart always --name gudigunae gudigunae-server

ex)
docker run -d -p 8080:8080 --restart always --name gudigunae gudigunae-server
```

## Docker를 활용한 Github Action Runner 등록
[토큰] 대신 `Settings -> Actions -> Runners -> New self-hosted runner`의 토큰 값 입력
``` bash
docker run -d --restart always --name gudigunae-server \
-e REPO_URL=https://github.com/krwd1117/gudiGunae-server \
-e RUNNER_TOKEN=[토큰] \
-v /var/run/docker.sock:/var/run/docker.sock \
myoung34/github-runner:latest
```