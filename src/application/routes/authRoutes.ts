import { Athlete, Technician } from "@prisma/client";
import bcrypt from "bcrypt";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "@/infrastructure/connection/prisma";
import { registerTechnique, registerAthlete, login } from "./schemas/auth";


export async function Authoutes(server: FastifyInstance) {

     server.withTypeProvider<ZodTypeProvider>()
          .post('/register/technician',
               {
                    schema: registerTechnique
               }
               , async (request, reply) => {
                    const { name, email, password, role } = request.body
                    const existUser = await prisma.technician.findUnique({ where: { email } })

                    if (existUser) {
                         reply.status(400).send({
                              Message: "The email is already being used!"
                         })
                    }

                    const technician = await prisma.technician.create({
                         data: {
                              name,
                              email,
                              password: bcrypt.hashSync(password, 10),
                              role
                         },
                    })

                    return reply.status(201).send({
                         Message: `Technician ${technician.name} was created successfully`,
                         Technician: technician
                    })
               })

          .post('/register/Athlete',
               {
                    schema: registerAthlete
               },
               async (request, reply) => {
                    const { name, email, password, shirtNmber, position, role } = request.body
                    const existUser = await prisma.athlete.findUnique({ where: { email } })

                    if (existUser) {
                         reply.status(400).send({
                              Message: "The email is already being used!"
                         })
                    }

                    const athlete = await prisma.athlete.create({
                         data: {
                              name,
                              email,
                              password: bcrypt.hashSync(password, 10),
                              position,
                              shirtNmber,
                              role
                         },
                    })


                    return reply.status(201).send({
                         Message: `Athlete ${athlete.name} was created successfully`,
                         Athlete: athlete
                    })
               })

          .post('/login',
               {
                    schema: login
               }
               , async (request, reply) => {
                    const { email, password } = request.body

                    const user =
                         (await prisma.technician.findUnique({ where: { email } })) ??
                         (await prisma.athlete.findUnique({ where: { email } })) as Technician | Athlete

                    if (!user) {
                         reply.status(404).send({
                              Message: "This email does not belong to any user"
                         })
                    }

                    if (bcrypt.compareSync(password, user.password)) {
                         const token = server.jwt.sign({
                              id: user.id,
                              role: user.role
                         })

                         reply.setCookie('token', token, {
                              maxAge: 60 * 60 * 24
                         })


                         return reply.status(202).send({
                              Message: "Authorized access",
                              User: user.name,
                              Token: token
                         })
                    } else {
                         return reply.status(401).send({
                              Message: "Unauthorized access"
                         })
                    }
               })

          .post('/logout', async (request, reply) => {
               reply.clearCookie("token")

               return reply.status(200).send({
                    Message: "Logout completed successfully"
               })
          })
}
