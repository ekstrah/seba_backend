pipeline {
    agent any

    environment {
        REGISTRY_URL = "registry.ailaplacelab.com"
        IMAGE_NAME = "dongho/seba-backend"
        LATEST_TAG = "latest"
        RANDOM_TAG = "build-${UUID.randomUUID().toString().take(8)}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image (dev)') {
            steps {
                script {
                    def fullLatest = "${REGISTRY_URL}/${IMAGE_NAME}:${LATEST_TAG}"
                    def fullRandom = "${REGISTRY_URL}/${IMAGE_NAME}:${RANDOM_TAG}"

                    echo "Building image with tags: ${fullLatest}, ${fullRandom}"

                    dockerImage = docker.build(
                        fullLatest,
                        "-f docker/dev.Dockerfile ."
                    )

                    // Tag image with random tag
                    sh "docker tag ${fullLatest} ${fullRandom}"
                }
            }
        }

        stage('Push to Private Registry') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'ailaplacelab-creds',
                    usernameVariable: 'REGISTRY_USER',
                    passwordVariable: 'REGISTRY_PASS'
                )]) {
                    script {
                        sh "echo $REGISTRY_PASS | docker login ${REGISTRY_URL} -u $REGISTRY_USER --password-stdin"

                        sh "docker push ${REGISTRY_URL}/${IMAGE_NAME}:${LATEST_TAG}"
                        sh "docker push ${REGISTRY_URL}/${IMAGE_NAME}:${RANDOM_TAG}"

                        sh "docker logout ${REGISTRY_URL}"
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up local Docker images...'
            sh "docker image prune -f"
        }
    }
}