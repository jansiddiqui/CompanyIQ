const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const envLocalPath = path.join(rootDir, '.env.local');
const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');

function getDatabaseUrl() {
  // Check process env first
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  // Check .env.local
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    const match = content.match(/^DATABASE_URL=["']?(.+?)["']?$/m);
    if (match && match[1]) return match[1];
  }

  // Check .env
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^DATABASE_URL=["']?(.+?)["']?$/m);
    if (match && match[1]) return match[1];
  }

  return null;
}

function run() {
  console.log('--- InvestIQ AI: Running Database Setup ---');

  let dbUrl = getDatabaseUrl();
  let useSqlite = false;

  if (!dbUrl || (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://'))) {
    console.log('No PostgreSQL DATABASE_URL detected. Configuring fallback to local SQLite database...');
    useSqlite = true;
    dbUrl = 'file:./dev.db';

    // Write or append to .env.local
    let envContent = '';
    if (fs.existsSync(envLocalPath)) {
      envContent = fs.readFileSync(envLocalPath, 'utf8');
      if (envContent.includes('DATABASE_URL=')) {
        envContent = envContent.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${dbUrl}"`);
      } else {
        envContent += `\nDATABASE_URL="${dbUrl}"`;
      }
    } else {
      envContent = `DATABASE_URL="${dbUrl}"\n# Fallback keys for local development (Fill these with actual keys or use defaults in API)\nTAVILY_API_KEY=""\nGEMINI_API_KEY=""\nNEWS_API_KEY=""\n`;
    }
    fs.writeFileSync(envLocalPath, envContent, 'utf8');
    console.log('✓ Configured .env.local with SQLite database URL.');
  } else {
    console.log('PostgreSQL database URL detected.');
  }

  // Update schema.prisma provider
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  if (useSqlite) {
    schemaContent = schemaContent.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
    console.log('✓ Updated prisma/schema.prisma to use "sqlite" provider.');
  } else {
    schemaContent = schemaContent.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
    console.log('✓ Updated prisma/schema.prisma to use "postgresql" provider.');
  }
  fs.writeFileSync(schemaPath, schemaContent, 'utf8');

  // Run prisma db push to apply changes
  console.log('Applying database schema via prisma db push...');
  try {
    // We execute with env variables loaded in case process.env doesn't have it yet
    const envVars = { ...process.env, DATABASE_URL: dbUrl };
    execSync('npx prisma db push', {
      cwd: rootDir,
      stdio: 'inherit',
      env: envVars,
    });
    console.log('✓ Database schema successfully applied.');

    console.log('Generating Prisma Client...');
    execSync('npx prisma generate', {
      cwd: rootDir,
      stdio: 'inherit',
      env: envVars,
    });
    console.log('✓ Prisma Client successfully generated.');
  } catch (error) {
    console.error('Error applying database schema:', error.message);
    process.exit(1);
  }

  console.log('--- Database Setup Complete ---');
}

run();
