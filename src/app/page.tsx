import NewBillForm from "./NewBillForm";

export default function Home() {
  return (
    <>
      <h1>Dibs</h1>
      <p className="muted">Photograph the bill. Share the link with your group. Everyone calls dibs on what they ate and pays by UPI.</p>
      <NewBillForm />
    </>
  );
}
