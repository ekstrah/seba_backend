pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'registry.ailaplacelab.com'
        DOCKER_IMAGE = 'seba-backend'
        DOCKER_CREDENTIALS_ID = 'docker-registry-credentials'
    }

    stages {
        stage('Prepare') {
            steps {
                script {
                    def timestamp = new Date().format('yyyyMMdd-HHmmss')
                    def buildNumber = env.BUILD_NUMBER ?: '1'
                    env.RANDOM_TAG = "build-${buildNumber}-${timestamp}"
                }
            }
        }

        stage('Build') {
            steps {
                sh """
                    unset DOCKER_TLS_VERIFY DOCKER_CERT_PATH DOCKER_HOST
                    docker build --no-cache -t ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:latest \\
                                 -t ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${RANDOM_TAG} .
                """
            }
        }

        stage('Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: DOCKER_CREDENTIALS_ID,
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        unset DOCKER_TLS_VERIFY DOCKER_CERT_PATH DOCKER_HOST

                        mkdir -p ~/.docker

                        cat > ~/.docker/config.json << EOF
                        {
                            "auths": {
                                "${DOCKER_REGISTRY}": {
                                    "auth": "$(echo -n "${DOCKER_USER}:${DOCKER_PASS}" | base64)"
                                }
                            }
                        }
                        EOF

                        docker login ${DOCKER_REGISTRY} -u ${DOCKER_USER} -p ${DOCKER_PASS}

                        docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:latest
                        docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${RANDOM_TAG}
                    """
                }
            }
        }
    }

    post {
        always {
            sh 'unset DOCKER_TLS_VERIFY DOCKER_CERT_PATH DOCKER_HOST || true'
            sh 'docker logout ${DOCKER_REGISTRY} || true'
            sh 'rm -f ~/.docker/config.json || true'
        }
        success {
            echo "Successfully built and pushed images:"
            echo "Latest: ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:latest"
            echo "Versioned: ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${RANDOM_TAG}"
        }
        failure {
            echo "Failed to build or push Docker images"
        }
    }
}
