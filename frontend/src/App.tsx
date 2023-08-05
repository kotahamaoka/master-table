import { ChangeEvent, useEffect, useState } from "react"
import classnames from "classnames"
import axios, { AxiosResponse } from "axios"
import { format } from "date-fns"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

type User = {
  id: number
  name: string
  empId: number
  birthDate: Date
}

type CreateUserData = {
  name: string
  empId: number
  birthDate: Date
}

type UpdateUserData = Partial<CreateUserData>

const userDataSchema = z.object({
  name: z.string().min(1, { message: "１文字以上で入力してください" }),
  // TODO:「0以上の整数値で入力してください」のように、エラーメッセージをまとめられないか？
  empId: z.number().int({ message: "整数値で入力してください" }).positive({ message: "1以上で入力してください" }),
  birthDate: z.date()
})

export type UserDataSchemaType = z.infer<typeof userDataSchema>

function formatDate(date: Date): string {
  const newDate = new Date(date)
  return format(newDate, "yyyyMMdd")
}

function getUsers(): Promise<AxiosResponse> {
  return axios.get("http://localhost:3000/user")
}

function createUser(data: CreateUserData): Promise<AxiosResponse> {
  const user = axios.post("http://localhost:3000/user", data)
  return user
}

function deleteUser(id: number): void {
  axios.delete(`http://localhost:3000/user/${id}`)
  window.location.reload()
}

function updateUser(id: number, data: UpdateUserData): void {
  axios.patch(`http://localhost:3000/user/${id}`, data)
  window.location.reload()
}

function App() {
  const [users, setUsers] = useState<User[]>([])
  useEffect(() => {
    getUsers()
      .then(res => {
        setUsers(res.data)
      })
      .catch(error => {
        console.log(error)
      })
  }, [])

  const [name, setName] = useState<string>("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [empId, setEmpId] = useState<number>(0)
  const [birthDate, setBirthDate] = useState<Date>(new Date())
  const handleDateChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const newDate = new Date(event.target.value)
    setBirthDate(newDate)
  }

  const clearField = (): void => {
    setName("")
    setEmpId(0)
    setBirthDate(new Date())
    setSelectedUser(null)
  }

  const onSubmit = (data: UserDataSchemaType): void => {
    if (!selectedUser) {
      createUser(data)
    }
    if (selectedUser) {
      updateUser(selectedUser.id, data)
    }
    // TODO：他にやり方ない？
    window.location.reload()
  }

  const setSelectedRow = (user: User): void => {
    setSelectedUser(user)
    reset({ name: user.name, empId: user.empId, birthDate: user.birthDate })
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<UserDataSchemaType>({ resolver: zodResolver(userDataSchema) })

  useEffect(() => {
    if (selectedUser) {
      setName(selectedUser.name)
      setEmpId(selectedUser.empId)
      setBirthDate(new Date(selectedUser.birthDate))
    }
    if (!selectedUser) {
      clearField()
    }
  }, [selectedUser])

  return (
    <div className="flex h-screen">
      <div className="w-2/3">
        <table className="w-full">
          <thead className="h-16 border border-black/10 bg-black/10">
            <tr>
              <th className="w-1/3 px-4" align="left">
                名前
              </th>
              <th className="w-1/3 px-4" align="left">
                社員番号
              </th>
              <th className="w-1/3 px-4" align="left">
                生年月日
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => {
              return (
                <tr onClick={() => setSelectedRow(user)} key={i} className={classnames("border-b border-black/10", { "bg-black/5": selectedUser === user })}>
                  <td className=" h-12 w-1/3 px-4">{user.name}</td>
                  <td className="h-12 w-1/3 px-4">{user.empId}</td>
                  <td className="h-12 w-1/3 px-4">{formatDate(user.birthDate)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="w-1/3 border-l px-14">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col pt-32">
            <label htmlFor="name">
              名前<span className="text-red-700">*</span>
            </label>
            <input {...register("name")} id="name" placeholder="山田 太郎" type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 h-10 rounded-lg border border-solid border-black/60 px-2" />
            {errors.name?.message && <p>{errors.name.message}</p>}
          </div>
          <div className="mt-6 flex flex-col">
            <label htmlFor="empId">
              社員番号<span className="text-red-700">*</span>
            </label>
            <input {...register("empId", { valueAsNumber: true })} id="empId" placeholder="11111" type="number" value={empId} onChange={e => setEmpId(Number(e.target.value))} className="mt-1 h-10 rounded-lg border border-solid border-black/60 px-2" />
            {errors.empId?.message && <p>{errors.empId.message}</p>}
          </div>
          <div className="mt-6 flex flex-col">
            <label htmlFor="birthDate">
              生年月日<span className="text-red-700">*</span>
            </label>
            <input {...register("birthDate", { valueAsDate: true })} id="birthDate" placeholder="yyyy/MM/dd" type="date" value={birthDate.toISOString().substr(0, 10)} onChange={handleDateChange} className="mt-1 h-10 rounded-lg border border-solid border-black/60 px-2" />
            {errors.birthDate?.message && <p>{errors.birthDate.message}</p>}
          </div>
          {selectedUser ? <button className="mt-12 h-10 w-full rounded-md bg-black text-white">更新</button> : <button className="mt-12 h-10 w-full rounded-md bg-black text-white">作成</button>}
        </form>
        {selectedUser && (
          <div className="flex flex-col">
            <button className="mt-6 h-10 w-full rounded-md bg-red-700 text-white" onClick={() => deleteUser(selectedUser.id)}>
              削除
            </button>
            <button className="mt-6 h-10 w-full rounded-md border-[1px] border-solid border-black/60 bg-transparent" onClick={clearField}>
              別のユーザを追加
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
