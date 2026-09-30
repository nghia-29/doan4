"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import taiKhoanService from "@/services/taiKhoanService";
import vaiTroService from "@/services/vaiTroService";
import { pickFirst } from "@/lib/format";
import { isAdminRole, isStaffRole, isCustomerRole } from "@/lib/constants";

const AuthContext = createContext(null);
const STORAGE_KEY = "nhathuoc_admin_session";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const savedUser = JSON.parse(raw);
        if (isAdminRole(savedUser?.vai_tro) || isStaffRole(savedUser?.vai_tro) || isCustomerRole(savedUser?.vai_tro)) {
          setUser(savedUser);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      // bỏ qua lỗi parse
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (tenDangNhap, matKhau) => {
    // Backend hiện chưa có endpoint đăng nhập riêng (POST /api/tai_khoan/login),
    // nên ta lấy danh sách tài khoản có sẵn (GET /api/tai_khoan) và đối chiếu
    // ở phía client. Nếu sau này backend bổ sung API đăng nhập, chỉ cần thay
    // thế nội dung hàm này bằng 1 lời gọi apiClient.post("/tai_khoan/login", ...).
    const [list, vaiTroList] = await Promise.all([
      taiKhoanService.getAll(),
      vaiTroService.getAll().catch(() => []),
    ]);
    const found = (list || []).find((acc) => {
      const u = pickFirst(acc, ["ten_dang_nhap", "username", "tai_khoan"], "");
      const p = pickFirst(acc, ["mat_khau", "password"], "");
      return (
        String(u).toLowerCase() === String(tenDangNhap).toLowerCase() &&
        String(p) === String(matKhau)
      );
    });

    if (!found) {
      throw new Error("Sai tên đăng nhập hoặc mật khẩu.");
    }

    const trangThai = pickFirst(found, ["trang_thai"], 1);
    if (Number(trangThai) === 0 || String(trangThai).toUpperCase() === "KHOA") {
      throw new Error("Tài khoản của bạn đã bị khóa.");
    }

    const roleId = pickFirst(found, ["id_vai_tro"], null);
    const role = (vaiTroList || []).find((item) => String(item.id) === String(roleId));
    const roleName = String(pickFirst(role, ["ten_vai_tro"], "")).toLowerCase();
    if (!["admin", "nv_quan_ly", "duoc_si", "khach_hang"].includes(roleName)) {
      throw new Error("Tài khoản này không có quyền truy cập trang quản trị.");
    }

    const sessionUser = {
      id: found.id,
      ten_dang_nhap: pickFirst(found, ["ten_dang_nhap", "username"], tenDangNhap),
      id_vai_tro: roleId,
      vai_tro: roleName,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return sessionUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong AuthProvider");
  return ctx;
}
