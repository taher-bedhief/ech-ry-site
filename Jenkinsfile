pipeline {
    agent any

    environment {
        DOCKER_IMAGE_NAME = 'taher2bedhief/echry-app'
        DOCKER_MIGRATION_IMAGE_NAME = 'taher2bedhief/echry-migration'
        DOCKER_IMAGE_TAG = "${BUILD_NUMBER}"
        GIT_BRANCH = "main"
    }

    stages {
        stage('Cleanup Workspace') {
            steps {
                deleteDir()
            }
        }

        stage('Clone Repository') {
            steps {
                git branch: "${env.GIT_BRANCH}", url: 'https://github.com/taher-bedhief/ech-ry-site.git'
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Main App Image') {
                    steps {
                        sh """
                            docker build -t ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG} -f Dockerfile .
                        """
                    }
                }

                stage('Build Migration Image') {
                    steps {
                        sh """
                            docker build -t ${DOCKER_MIGRATION_IMAGE_NAME}:${DOCKER_IMAGE_TAG} -f scripts/Dockerfile.migration .
                        """
                    }
                }
            }
        }

        stage('Security Scan with Trivy') {
            steps {
                sh """
                    mkdir -p trivy-results
                    trivy image --exit-code 1 --severity HIGH,CRITICAL ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG} > t
