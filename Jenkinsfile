pipeline {
    agent any

    environment {
        DOCKER_IMAGE_NAME = 'taher2bedhief/echry-app'
        DOCKER_MIGRATION_IMAGE_NAME = 'taher2bedhief/echry-migration'
        DOCKER_IMAGE_TAG = "${BUILD_NUMBER}"
        GIT_BRANCH = "main"
        TRIVY_RESULTS_DIR = "trivy-results"
    }

    options {
        timestamps()
        ansiColor('xterm')
    }

    stages {
        stage('Cleanup Workspace') {
            steps {
                deleteDir()
                echo "Workspace nettoyé"
            }
        }

        stage('Clone Repository') {
            steps {
                git branch: "${env.GIT_BRANCH}", url: 'https://github.com/taher-bedhief/ech-ry-site.git'
                echo "Dépôt cloné depuis GitHub"
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

        stage('Run Unit Tests') {
            agent {
                docker {
                    image 'node:18-alpine'
                    args '-u root'
                }
            }
            steps {
                sh """
                    npm install
                    npm test
                """
            }
        }

        stage('Security Scan with Trivy') {
            steps {
                sh """
                    mkdir -p ${TRIVY_RESULTS_DIR}
                    trivy image ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG} > ${TRIVY_RESULTS_DIR}/app.txt
                    trivy image ${DOCKER_MIGRATION_IMAGE_NAME}:${DOCKER_IMAGE_TAG} > ${TRIVY_RESULTS_DIR}/migration.txt
                """
                archiveArtifacts artifacts: "${TRIVY_RESULTS_DIR}/*.txt", fingerprint: true
            }
        }

        stage('Push Docker Images') {
            parallel {
                stage('Push Main App Image') {
                    steps {
                        withCredentials([usernamePassword(credentialsId: 'crd_dockerhub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                            sh """
                                echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                                docker push ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}
                            """
                        }
                    }
                }

                stage('Push Migration Image') {
                    steps {
                        withCredentials([usernamePassword(credentialsId: 'crd_dockerhub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                            sh """
                                echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                                docker push ${DOCKER_MIGRATION_IMAGE_NAME}:${DOCKER_IMAGE_TAG}
                            """
                        }
                    }
                }
            }
        }

        stage('Update Kubernetes Manifests') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'crd_github', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
                    sh """
                        git config user.name 'Jenkins CI'
                        git config user.email 'tbedhief20@gmail.com'
                        sed -i 's|image: .*|image: ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}|' kubernetes/deployment.yaml
                        git add kubernetes/
                        git commit -m 'Update image tag to ${DOCKER_IMAGE_TAG}'
                        git push https://${GIT_USER}:${GIT_PASS}@github.com/taher-bedhief/ech-ry-site.git ${GIT_BRANCH}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline terminé avec succès"
        }
        failure {
            echo "Échec du pipeline"
        }
        always {
            echo "Pipeline terminé (succès ou échec)"
        }
    }
}
