import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const SEDES = [
  { name: "Ciudad Universitaria" },
  { name: "Sede 2 de Mayo" },
  { name: "Sede 3" },
  { name: "Fundo El Bosque" },
  { name: "Planta Piloto" },
]

// sedeIndex maps original sede_id to array index: 1->0, 2->1, 4->3, 5->4
const DEPENDENCIAS = [
  { sedeIdx: 0, abbr: "OTI", name: "Oficina de Tecnologias de la Informacion" },
  { sedeIdx: 0, abbr: "AU", name: "Asamblea Universitaria" },
  { sedeIdx: 0, abbr: "CU", name: "Consejo Universitario" },
  { sedeIdx: 0, abbr: "R", name: "Rectorado" },
  { sedeIdx: 0, abbr: "VRA", name: "Vicerrectorado Academico" },
  { sedeIdx: 0, abbr: "VRI", name: "Vicerrectorado de Investigacion" },
  { sedeIdx: 0, abbr: "OCI", name: "Organo de Control Institucional" },
  { sedeIdx: 0, abbr: "CPF", name: "Comision Permanente de Fiscalizacion" },
  { sedeIdx: 0, abbr: "TH", name: "Tribunal de Honor" },
  { sedeIdx: 0, abbr: "DU", name: "Defensoria Universitaria" },
  { sedeIdx: 0, abbr: "OPP", name: "Oficina de Planeamiento y Presupuesto" },
  { sedeIdx: 0, abbr: "UF", name: "Unidad Formuladora" },
  { sedeIdx: 0, abbr: "UPE", name: "Unidad de Planeamiento Estrategico" },
  { sedeIdx: 0, abbr: "UP", name: "Unidad de Presupuesto" },
  { sedeIdx: 0, abbr: "UME", name: "Unidad de Modernizacion y Estadistica" },
  { sedeIdx: 0, abbr: "OAJ", name: "Oficina de Asesoria Juridica" },
  { sedeIdx: 0, abbr: "OCRI", name: "Oficina de Cooperacion y Relaciones Internacionales" },
  { sedeIdx: 0, abbr: "UGC", name: "Oficina de Gestion de la Calidad" },
  { sedeIdx: 0, abbr: "OCII", name: "Oficina de Comunicacion e Imagen Institucional" },
  { sedeIdx: 0, abbr: "DIGA", name: "Direccion General de Administracion" },
  { sedeIdx: 0, abbr: "UC", name: "Unidad de Contabilidad" },
  { sedeIdx: 0, abbr: "UA", name: "Unidad de Abastecimiento" },
  { sedeIdx: 0, abbr: "UT", name: "Unidad de Tesoreria" },
  { sedeIdx: 0, abbr: "UBP", name: "Unidad de Bienes Patrimoniales" },
  { sedeIdx: 0, abbr: "URH", name: "Unidad de Recursos Humanos" },
  { sedeIdx: 0, abbr: "UEI", name: "Unidad Ejecutora de Inversiones" },
  { sedeIdx: 0, abbr: "USG", name: "Unidad de Servicios Generales" },
  { sedeIdx: 0, abbr: "USRT-OTI", name: "Unidad de Soporte, Redes y Telecomunicaciones" },
  { sedeIdx: 0, abbr: "UDP-OTI", name: "Unidad de Diseno y Programacion" },
  { sedeIdx: 0, abbr: "SG", name: "Secretaria General" },
  { sedeIdx: 0, abbr: "UAC", name: "Unidad de Archivo Central" },
  { sedeIdx: 0, abbr: "UGT", name: "Unidad de Grados y Titulos" },
  { sedeIdx: 0, abbr: "UTD", name: "Unidad de Tramite Documentario" },
  { sedeIdx: 1, abbr: "EPG", name: "Escuela de Posgrado" },
  { sedeIdx: 0, abbr: "DA", name: "Direccion de Admision" },
  { sedeIdx: 0, abbr: "DBC", name: "Direccion de Biblioteca Central" },
  { sedeIdx: 0, abbr: "DPSEC", name: "Direccion de Proyeccion Social y Extension Cultural" },
  { sedeIdx: 0, abbr: "DBU", name: "Direccion de Bienestar Universitario" },
  { sedeIdx: 0, abbr: "DAA", name: "Direccion de Asuntos Academicos" },
  { sedeIdx: 0, abbr: "DIE", name: "Direccion de Incubadora de Empresas" },
  { sedeIdx: 0, abbr: "INI", name: "Instituto de Investigacion" },
  { sedeIdx: 0, abbr: "DIGI", name: "Direccion General de Investigacion" },
  { sedeIdx: 0, abbr: "FCE", name: "Facultad de Ciencias Empresariales" },
  { sedeIdx: 0, abbr: "FED", name: "Facultad de Educacion" },
  { sedeIdx: 0, abbr: "FI", name: "Facultad de Ingenieria" },
  { sedeIdx: 0, abbr: "EPDCP", name: "Escuela Profesional de Derecho y Ciencias Politicas" },
  { sedeIdx: 0, abbr: "EPCYF", name: "Escuela Profesional de Contabilidad y Finanzas" },
  { sedeIdx: 0, abbr: "EPAYNI", name: "Escuela Profesional de Administracion y Negocios Internacionales" },
  { sedeIdx: 0, abbr: "EPE", name: "Escuela Profesional de Ecoturismo" },
  { sedeIdx: 0, abbr: "EPED", name: "Escuela Profesional de Educacion" },
  { sedeIdx: 0, abbr: "EPMVZ", name: "Escuela Profesional de Medicina Veterinaria y Zootecnia" },
  { sedeIdx: 0, abbr: "EPEN", name: "Escuela Profesional de Enfermeria" },
  { sedeIdx: 0, abbr: "EPISI", name: "Escuela Profesional de Ingenieria de Sistemas e Informatica" },
  { sedeIdx: 0, abbr: "EPIA", name: "Escuela Profesional de Ingenieria Agroindustrial" },
  { sedeIdx: 0, abbr: "EPIFYMA", name: "Escuela Profesional de Ingenieria Forestal y Medio Ambiente" },
  { sedeIdx: 1, abbr: "CEPRE", name: "Centro Preuniversitario" },
  { sedeIdx: 1, abbr: "CEINFO", name: "Centro de Informatica" },
  { sedeIdx: 1, abbr: "CIIDIOMAS", name: "Centro de Idiomas" },
  { sedeIdx: 0, abbr: "DITRAT", name: "Direccion de Innovacion y Transferencia Tecnologica" },
  { sedeIdx: 1, abbr: "DIPROBYS", name: "Direccion de Produccion de Bienes y Servicios" },
  { sedeIdx: 0, abbr: "CTIMH", name: "Escuela Profesional de Medicina Humana" },
  { sedeIdx: 3, abbr: "VIV.FOR.", name: "Vivero Forestal Fundo El Bosque" },
  { sedeIdx: 4, abbr: "PPTM", name: "Planta Piloto de Tecnologia de la Madera" },
  { sedeIdx: 0, abbr: "EPECON", name: "Escuela Profesional de Economia" },
  { sedeIdx: 0, abbr: "EPP", name: "Escuela Profesional de Psicologia" },
  { sedeIdx: 0, abbr: "EP.B", name: "Escuela Profesional de Biologia" },
  { sedeIdx: 0, abbr: "USO", name: "Unidad de Seguridad y Salud en el Trabajo" },
]

async function main() {
  // Create sedes
  const sedes = []
  for (const s of SEDES) {
    const sede = await prisma.sede.upsert({
      where: { name: s.name },
      update: {},
      create: { name: s.name },
    })
    sedes.push(sede)
    console.log(`Sede: ${sede.name}`)
  }

  // Create dependencias
  let count = 0
  for (const d of DEPENDENCIAS) {
    const existing = await prisma.dependencia.findFirst({
      where: { abbreviation: d.abbr, sedeId: sedes[d.sedeIdx].id },
    })
    if (!existing) {
      await prisma.dependencia.create({
        data: {
          sedeId: sedes[d.sedeIdx].id,
          abbreviation: d.abbr,
          name: d.name,
        },
      })
      count++
    }
  }
  console.log(`${count} dependencias creadas`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
