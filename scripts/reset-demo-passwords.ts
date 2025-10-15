import { getDatabase } from "../lib/db"
import { hashPassword } from "../lib/auth"

async function resetAllDemoPasswords() {
    const db = getDatabase()
    const users = [
        { email: "student@test.com", password: "student123", name: "Default Student", role: "student" },
        { email: "teacher@test.com", password: "teacher123", name: "Default Teacher", role: "teacher" },
        { email: "admin@test.com", password: "admin123", name: "Default Admin", role: "admin" }
        // Add more demo users here if needed
    ]

    for (const user of users) {
        const hashed = await hashPassword(user.password)
        const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(user.email)
        if (existing) {
            // If classes and class_id exist, try to preserve or set default
            const defaultClass = db.prepare("SELECT id FROM classes ORDER BY id LIMIT 1").get()
            if (defaultClass) {
                db.prepare("UPDATE users SET password = ?, name = ?, role = ?, class_id = ? WHERE email = ?").run(
                    hashed,
                    user.name,
                    user.role,
                    defaultClass.id,
                    user.email
                )
            } else {
                db.prepare("UPDATE users SET password = ?, name = ?, role = ? WHERE email = ?").run(hashed, user.name, user.role, user.email)
            }
            console.log(`Password for ${user.email} reset to ${user.password}`)
        } else {
            const defaultClass = db.prepare("SELECT id FROM classes ORDER BY id LIMIT 1").get()
            if (defaultClass) {
                db.prepare("INSERT INTO users (email, password, name, role, class_id) VALUES (?, ?, ?, ?, ?)").run(
                    user.email,
                    hashed,
                    user.name,
                    user.role,
                    defaultClass.id
                )
            } else {
                db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run(
                    user.email,
                    hashed,
                    user.name,
                    user.role
                )
            }
            console.log(`User ${user.email} created with password ${user.password}`)
        }
    }
}

resetAllDemoPasswords()
