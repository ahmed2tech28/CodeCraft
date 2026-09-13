import { buildServer } from '../index.js';
import { userRepository, systemRepository } from '@codecraft/db';

async function runServerApiTests() {
  console.log('🧪 Starting Server API Integration Tests...');

  const server = await buildServer();

  // 1. Test Health Endpoint
  const healthRes = await server.inject({
    method: 'GET',
    url: '/api/system/health',
  });
  if (healthRes.statusCode !== 200) {
    throw new Error(`Health check failed with status: ${healthRes.statusCode}`);
  }
  const healthBody = JSON.parse(healthRes.body);
  if (healthBody.status !== 'ok') {
    throw new Error('Health check response invalid');
  }
  console.log('  ✓ GET /api/system/health verified');

  // 2. Test Auth Status
  const authStatusRes = await server.inject({
    method: 'GET',
    url: '/api/auth/status',
  });
  if (authStatusRes.statusCode !== 200) {
    throw new Error(`Auth status check failed with status: ${authStatusRes.statusCode}`);
  }
  console.log('  ✓ GET /api/auth/status verified');

  // 3. Test Project Creation API
  const createProjRes = await server.inject({
    method: 'POST',
    url: '/api/projects',
    payload: {
      name: 'API Test App',
      template: 'nextjs',
    },
  });
  if (createProjRes.statusCode !== 201) {
    throw new Error(`Project creation API failed with status: ${createProjRes.statusCode}, body: ${createProjRes.body}`);
  }
  const projectBody = JSON.parse(createProjRes.body);
  const projectId = projectBody.project.id;
  console.log('  ✓ POST /api/projects created workspace');

  // 4. Test Workspace File Tree API
  const filesRes = await server.inject({
    method: 'GET',
    url: `/api/projects/${projectId}/files`,
  });
  if (filesRes.statusCode !== 200) {
    throw new Error(`Get files API failed with status: ${filesRes.statusCode}`);
  }
  const filesBody = JSON.parse(filesRes.body);
  if (!filesBody.files || filesBody.files.length === 0) {
    throw new Error('File tree returned empty list');
  }
  console.log('  ✓ GET /api/projects/:id/files verified');

  // 5. Test Reading File Content API
  const readFileRes = await server.inject({
    method: 'GET',
    url: `/api/projects/${projectId}/file?path=package.json`,
  });
  if (readFileRes.statusCode !== 200) {
    throw new Error(`Read file API failed: ${readFileRes.body}`);
  }
  console.log('  ✓ GET /api/projects/:id/file verified');

  // 6. Test Delete Project API
  const deleteRes = await server.inject({
    method: 'DELETE',
    url: `/api/projects/${projectId}`,
  });
  if (deleteRes.statusCode !== 200) {
    throw new Error(`Delete project API failed: ${deleteRes.body}`);
  }
  console.log('  ✓ DELETE /api/projects/:id cleaned up project');

  console.log('🎉 ALL SERVER API INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
}

runServerApiTests().catch((err) => {
  console.error('❌ Server API Test Failed:', err);
  process.exit(1);
});
