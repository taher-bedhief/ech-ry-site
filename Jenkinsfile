@Library('shared') _

pipeline {
    agent any

    environment {
        DOCKER_IMAGE_NAME           = "taher2bedhief/echry-app"
        DOCKER_MIGRATION_IMAGE_NAME = "taher2bedhief/echry-migration"
        DOCKER_IMAGE_TAG            = "${BUILD_NUMBER}"

        GIT_BRANCH            = "main"
        DOCKERHUB_CREDENTIALS = 'crd_dockerhub'

        MONGO_URI = credentials('atlas_mongodb_uri')
    }

    stages {

        stage('Test Shared Library') {
            steps {
                script { 
                    echo "🔹 Running shared library test..."
                    shared() 
                }
            }
        }

        stage('Cleanup Workspace') {
            steps {
                script { 
                    echo "🔹 Cleaning workspace..."
                    clean_ws() 
                }
            }
        }

        stage('Clone Repository') {
            steps {
                script {
                    echo "🔹 Cloning repo ${env.GIT_BRANCH}..."
                    clone('https://github.com/taher-bedhief/ech-ry-site.git', env.GIT_BRANCH)
                }
            }
        }

        stage('Install Dependencies') {
            agent {
                docker {
                    image 'node:20-bullseye'
                    args "-u root:root -e MONGO_URI=${env.MONGO_URI} -v ${env.WORKSPACE}:${env.WORKSPACE} -w ${env.WORKSPACE}"
                }
            }
            steps {
                echo "🔹 Installing dependencies..."
                sh '''
                    set -x
                    npm ci --legacy-peer-deps --verbose
                    npx next telemetry disable
                '''
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Main App Image') {
                    steps {
                        script {
                            echo "🔹 Building main app Docker image..."
                            docker_build(
                                imageName: env.DOCKER_IMAGE_NAME,
                                imageTag: env.DOCKER_IMAGE_TAG,
                                dockerfile: 'Dockerfile',
                                context: '.',
                                buildArgs: ["MONGO_URI=${env.MONGO_URI}"]
                            )
                        }
                    }
                }

                stage('Build Migration Image') {
                    steps {
                        script {
                            echo "🔹 Building migration Docker image..."
                            docker_build(
                                imageName: env.DOCKER_MIGRATION_IMAGE_NAME,
                                imageTag: env.DOCKER_IMAGE_TAG,
                                dockerfile: 'scripts/Dockerfile.migration',
                                context: '.',
                                buildArgs: ["MONGO_URI=${env.MONGO_URI}"]
                            )
                        }
                    }
                }
            }
        }

        stage('Run Unit Tests') {
            agent {
                docker {
                    image 'node:20-bullseye'
                    args "-u root:root -v ${env.WORKSPACE}:${env.WORKSPACE} -w ${env.WORKSPACE}"
                }
            }
            steps {
                script {
                    echo "🔹 Running unit tests..."
                    try {
                        run_tests()
                    } catch (err) {
                        echo "❌ Unit tests failed: ${err}"
                        currentBuild.result = 'FAILURE'
                        error("Stopping pipeline due to test failure")
                    }
                }
            }
        }

        stage('Security Scan with Trivy') {
            steps {
                script {
                    echo "🔹 Running security scan..."
                    sh '''
                        set -x
                        mkdir -p /var/lib/jenkins/trivy-cache
                        docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v $PWD:/workspace \
                            -v /var/lib/jenkins/trivy-cache:/root/.cache/ \
                            aquasec/trivy:latest fs \
                            --cache-dir /root/.cache/ \
                            --scanners vuln \
                            --severity HIGH,CRITICAL \
                            --no-progress \
                            /workspace || true
                    '''
                }
            }
        }

        stage('Push Docker Images') {
            parallel {
                stage('Push Main App Image') {
                    steps {
                        script {
                            echo "🔹 Pushing main app image..."
                            docker_push(
                                imageName: env.DOCKER_IMAGE_NAME,
                                imageTag: env.DOCKER_IMAGE_TAG,
                                credentials: env.DOCKERHUB_CREDENTIALS
                            )
                        }
                    }
                }

                stage('Push Migration Image') {
                    steps {
                        script {
                            echo "🔹 Pushing migration image..."
                            docker_push(
                                imageName: env.DOCKER_MIGRATION_IMAGE_NAME,
                                imageTag: env.DOCKER_IMAGE_TAG,
                                credentials: env.DOCKERHUB_CREDENTIALS
                            )
                        }
                    }
                }
            }
        }

        stage('Update Kubernetes Manifests') {
            steps {
                script {
                    echo "🔹 Updating Kubernetes manifests..."
                    update_k8s_manifests(
                        imageTag: env.DOCKER_IMAGE_TAG,
                        manifestsPath: 'kubernetes',
                        gitCredentials: 'crd_github',
                        gitUserName: 'Jenkins CI',
                        gitUserEmail: 'tbedhief20@gmail.com'
                    )
                }
            }
        }
    }

    post {
        always {
            echo '📌 Pipeline finished.'
            cleanWs()
        }
        success {
            echo '✅ Pipeline succeeded!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
