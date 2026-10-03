async function main() {
  const res = await fetch('https://kwaleebeachresort.com/api/menu-orders');
  const data = await res.json();
  console.log('Success:', data.success);
  console.log('Data length:', data.data ? data.data.length : 'N/A');
}
main();
