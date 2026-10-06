import NewBillForm from "./NewBillForm";

export default function Home() {
  return (
    <>
      <h1>Baant</h1>
      <p className="muted">Take a photo of the bill. Share the link with your group. Everyone taps what they ate and pays by UPI.</p>
      <NewBillForm />
    </>
  );
}
