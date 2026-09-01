async function main() {
  console.log(
    'Database seed is a no-op. Use scripts/migrate-mongo-to-postgres.ts for data migration.'
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
