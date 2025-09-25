terraform {
  backend "s3" {
    bucket = "terraform-s3-backend-ecommerce-app"
    key    = "backend-locking"
    region = "eu-west-3"
  }
}