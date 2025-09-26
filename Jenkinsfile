pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKERHUB_REPO = 'taherbedhief/easyshop'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/taher-bedhief/ech-ry-site.git',
                    credentialsId: 'crd_github'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker build -t $DOCKERHUB_REPO-frontend:latest ./frontend'
                sh 'docker build -t $DOCKERHUB_REPO-backend:latest ./backend'
            }
        }

        stage('Security Scan with Trivy') {
            steps {
                sh 'trivy image $DOCKERHUB_REPO-frontend:latest || true'
                sh 'trivy image $DOCKERHUB_REPO-backend:latest || true'
            }
        }

        stage('Push Docker Images') {
            steps {
                withDockerRegistry([credentialsId: 'dockerhub-credentials', url: 'https://index.docker.io/v1/']) {
                    sh 'docker push $DOCKERHUB_REPO-frontend:latest'
                    sh 'docker push $DOCKERHUB_REPO-backend:latest'
                }
            }
        }
    }
}
