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
                // Generate structured tag with timestamp and build number
                script {
                    def timestamp = new Date().format('yyyyMMdd-HHmmss')
                    def buildNumber = env.BUILD_NUMBER ?: '1'
                    env.RANDOM_TAG = "build-${buildNumber}-${timestamp}"
                }
            }
        }

        stage('Build') {
            steps {
                // Build Docker image with latest and random tag
                sh """
                    docker build --no-cache -t ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:latest \
                                -t ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${RANDOM_TAG} .
                """
            }
        }

        stage('Push') {
            steps {
                // Login to Docker registry
                withCredentials([usernamePassword(
                    credentialsId: DOCKER_CREDENTIALS_ID,
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        # Create Docker config directory if it doesn't exist
                        mkdir -p ~/.docker
                        
                        # Configure Docker to trust the registry's certificate
                        cat > ~/.docker/config.json << EOF
                        {
                            "auths": {
                                "\${DOCKER_REGISTRY}": {
                                    "auth": "\$(echo -n "\${DOCKER_USER}:\${DOCKER_PASS}" | base64)"
                                }
                            },
                            "insecure-registries": []
                        }
                        EOF
                        
                        # Login to registry
                        docker login ${DOCKER_REGISTRY} -u ${DOCKER_USER} -p ${DOCKER_PASS}
                        
                        # Push images
                        docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:latest
                        docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${RANDOM_TAG}
                    """
                }
            }
        }
    }

    post {
        always {
            // Cleanup
            sh 'docker logout ${DOCKER_REGISTRY}'
            sh 'rm -f ~/.docker/config.json'
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