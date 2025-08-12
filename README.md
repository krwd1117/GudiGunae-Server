# Docker 

## Docker 빌드 명령어
``` bash
docker build -t gudigunae-server .
```

## Docker 자동 실행 명령어
[포트 번호] 대신 실제 운영중인 포트의 번호를 입력해야 함

``` bash
docker run -d -p [포트 번호] --restart always --name gudigunae gudigunae-server

ex)
docker run -d -p 8080:8080 --restart always --name gudigunae gudigunae-server
```