########################################################
# Security Group pour accès SSH
########################################################
resource "aws_security_group" "node_group_remote_access" {
  name   = "allow-ssh-access"
  vpc_id = module.vpc.vpc_id

  ingress {
    description = "Allow SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # À restreindre en production
  }

  egress {
    description = "Allow all outgoing traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name                    = local.name
  cluster_version                 = "1.34"
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  access_entries = {
    terraform = {
      principal_arn = "arn:aws:iam::876997124628:user/terraform"
      policy_associations = {
        admin = {
          policy_arn   = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = { type = "cluster" }
        }
      }
    }

    taher = {
      principal_arn = "arn:aws:iam::216040614736:user/taher_bedhief"
      policy_associations = {
        admin = {
          policy_arn   = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = { type = "cluster" }
        }
      }
    }
  }

  cluster_security_group_additional_rules = {
    allow_https_from_jenkins = {
      description = "Allow HTTPS from Jenkins/Bastion"
      protocol    = "tcp"
      from_port   = 443
      to_port     = 443
      cidr_blocks = ["0.0.0.0/0"]
      type        = "ingress"
    }
  }

  cluster_enabled_log_types = ["api", "audit", "authenticator"]

  cluster_addons = {
    coredns   = { most_recent = true }
    kube-proxy = { most_recent = true }
    vpc-cni   = { most_recent = true }
  }

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.public_subnets
  control_plane_subnet_ids = module.vpc.private_subnets

  eks_managed_node_group_defaults = {
    instance_types = ["t3.small"]
    attach_cluster_primary_security_group = true
  }

  eks_managed_node_groups = {
    echry-ng = {
      min_size     = 1
      desired_size = 2
      max_size     = 3

      instance_types = ["t3.medium"]
      capacity_type  = "SPOT"
      disk_size      = 50
      use_custom_launch_template = false

      remote_access = {
        ec2_ssh_key               = aws_key_pair.deployer.key_name
        source_security_group_ids = [aws_security_group.node_group_remote_access.id]
      }

      tags = local.tags
    }
  }

  tags = local.tags
}

########################################################
# Récupération des instances EKS
########################################################
data "aws_instances" "eks_nodes" {
  instance_tags = {
    "eks:cluster-name" = module.eks.cluster_name
  }

  filter {
    name   = "instance-state-name"
    values = ["running"]
  }

  depends_on = [module.eks]
}
