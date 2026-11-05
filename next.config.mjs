export default {
  async rewrites() {
    const backend = process.env.ALLOCATEAI_BACKEND_URL || 'http://127.0.0.1:8766';
    return ['allocate', 'rounds'].map(path => ({
      source: '/api/' + path, destination: backend + '/api/' + path,
    }));
  },
};
