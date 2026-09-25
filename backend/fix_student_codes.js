const prisma = require("./src/config/prisma");

async function main() {
  const students = await prisma.student.findMany();
  console.log(`Found ${students.length} students to process.`);
  
  for (const s of students) {
    const seq = parseInt(s.studentCode.replace(/[^0-9]/g, ""), 10) || s.id;
    const date = s.admissionDate || s.createdAt || new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    
    const newCode = `STD${String(seq).padStart(5, "0")}`;
    const newRegNo = `REG${year}${month}${String(seq).padStart(5, "0")}`;
    
    console.log(`Updating student ID ${s.id}: ${s.studentCode} -> ${newCode}, ${s.regNo} -> ${newRegNo}`);
    
    try {
      await prisma.student.update({
        where: { id: s.id },
        data: {
          studentCode: newCode,
          regNo: newRegNo
        }
      });
    } catch (err) {
      console.error(`Failed to update student ID ${s.id}:`, err.message);
    }
  }
  
  console.log("Database update completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
