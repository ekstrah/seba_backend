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
                    docker build -t ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:latest \
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
                        echo ${DOCKER_PASS} | docker login ${DOCKER_REGISTRY} -u ${DOCKER_USER} --password-stdin
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