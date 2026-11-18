import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[#F4F8FB]">
      <div className="max-w-md text-center space-y-5">
        <p className="text-sm font-semibold text-[#1E5079]">ไม่พบหน้าที่ต้องการ</p>
        <h1 className="text-4xl text-[#0F2A42]">404</h1>
        <p className="text-[#5A6F83]">
          หน้านี้อาจถูกย้ายหรือลบไปแล้ว ลองกลับไปที่หน้าแรก หรือทำข้อสอบวัดระดับฟรี
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="px-6 py-3 rounded-full bg-[#1E5079] text-white font-semibold">
            กลับหน้าแรก
          </Link>
          <Link href="/mock-exam" className="px-6 py-3 rounded-full border-2 border-[#1E5079] text-[#1E5079] font-semibold">
            ทำข้อสอบวัดระดับ
          </Link>
        </div>
      </div>
    </main>
  );
}
