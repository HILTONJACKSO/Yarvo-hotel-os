async function main() {
  const res = await fetch('https://kwaleebeachresort.com/api/menu-orders');
  const data = await res.json();
  console.log(JSON.stringify(data).substring(0, 500));
}
main();
