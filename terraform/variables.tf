variable "aws_region" {
  description = "AWS region where resources will be provisioned"
  default     = "eu-west-3"
}

variable "instance_id" {
  description = "ID of the existing EC2 instance"
  default     = "i-052c72cfd88cf9671"
}

variable "instance_type" {
  description = "Type of the EC2 instance"
  default     = "t3.small"
}

variable "my_environment" {
  description = "Environment tag for the EC2 instance"
  default     = "dev"
}
