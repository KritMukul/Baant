import NewBillForm from "./NewBillForm";

export default function Home() {
  return (
    <>
      <h1>Baant</h1>
      <p className="muted">Bill ki photo kheencho. Link group mein bhejo. Sab apne items tap karein, UPI se pay karein.</p>
      <NewBillForm />
    </>
  );
}
