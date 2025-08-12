# =============================================
# 1. 빌드(Build) 스테이지: Maven과 JDK를 이용해 .jar 파일을 생성
# =============================================
FROM openjdk:17-jdk-slim AS builder

# 작업 디렉토리 설정
WORKDIR /workspace

# Maven Wrapper 파일 복사
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Maven 종속성(dependencies)을 먼저 다운로드하여 캐시 효율 극대화
RUN ./mvnw dependency:go-offline

# 소스 코드 전체 복사
COPY src ./src

# 테스트는 생략하고 애플리케이션 빌드
RUN ./mvnw package -DskipTests


# =============================================
# 2. 실행(Runner) 스테이지: 빌드된 .jar 파일만 가져와 최종 이미지 생성
# =============================================
FROM openjdk:17-jdk-slim

# 작업 디렉토리 설정
WORKDIR /app

# 보안을 위해 non-root 사용자 생성 및 전환
RUN adduser \
    --system \
    --shell /bin/bash \
    --disabled-password \
    --group \
    --home /app \
    appuser
USER appuser

# 빌드 스테이지(builder)에서 생성된 .jar 파일을 복사
COPY --from=builder /workspace/target/*.jar app.jar

# 애플리케이션 실행
ENTRYPOINT ["java","-jar","app.jar"]