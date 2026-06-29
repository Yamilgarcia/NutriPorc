import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Asegúrate de importar updateDoc
import { auth, db } from "../../../../firebase.config";

export const loginConRoles = async (email, password) => {
  if (!email || !password) throw new Error("Todos los campos son obligatorios.");

  try {
    // 1. Autenticar con Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Traer el perfil del usuario para saber a qué finca pertenece
    const userDocRef = doc(db, "usuarios", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      throw new Error("El usuario no tiene un perfil asignado.");
    }

    const userData = userDocSnap.data();
    const fincaId = userData.fincaId;

    // 3. Obtener los datos de la finca
    const fincaDocRef = doc(db, "fincas", fincaId);
    const fincaDocSnap = await getDoc(fincaDocRef);
    let fincaData = fincaDocSnap.data(); // Usamos 'let' para poder actualizarla en memoria

    // 4. Capturar parámetro de Stripe en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const vieneDeStripe = urlParams.get('pago') === 'exitoso';

    // 5. 🔥 LA SOLUCIÓN: Si viene de pagar, actualizamos Firebase inmediatamente
    if (vieneDeStripe && fincaData.estado_suscripcion === "pendiente_pago") {
      await updateDoc(fincaDocRef, { estado_suscripcion: "activa" });
      fincaData.estado_suscripcion = "activa"; // Lo actualizamos localmente para que pase el filtro de abajo
    }

    // 6. Lógica de Bloqueo Estricto
    // Si sigue pendiente después de todo, lo bloqueamos.
    if (fincaData.plan === "Pro" && fincaData.estado_suscripcion === "pendiente_pago") {
      auth.signOut();
      throw new Error("Tu cuenta Pro está pendiente de pago. Completa la suscripción para acceder.");
    }

    // 7. Estructurar la sesión para React
    const sesion = {
      uid: user.uid,
      email: userData.email,
      role: userData.role,
      fincaId: fincaId,
      fincaNombre: fincaData.nombre,
      plan: fincaData.plan,
      token: user.accessToken,
      expiraEn: Date.now() + 3600000 
    };
    
    localStorage.setItem("nutriporc_session", JSON.stringify(sesion));
    return sesion;

  } catch (error) {
    console.error("Error en login:", error);
    if (error.code === 'auth/invalid-credential') {
      throw new Error("Credenciales incorrectas. Verifica tu correo y contraseña.", { cause: error });
    }
    throw new Error(error.message || "Error al iniciar sesión.", { cause: error });
  }
};