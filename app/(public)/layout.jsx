import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PublicLayout({ children }) {
  return (
    <>
      
      <main>{children}</main>
      <Footer />
    </>
  );
}
