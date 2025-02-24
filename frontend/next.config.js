/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_HF_SPACE_URL: process.env.HF_SPACE_URL || 'https://aakashpathak-connectle-huggingface.hf.space'
  }
}

module.exports = nextConfig
