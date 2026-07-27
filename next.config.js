/** @type {import('next').NextConfig} */
const config = {
  output: "standalone",
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "echry-images.s3.eu-west-3.amazonaws.com",
        pathname: "**",
      },
    ],
  },
};

module.exports = config;
