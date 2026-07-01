import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../../firebase.config";
import emailjs from '@emailjs/browser';

/**
 * FASE 1: Validar credenciales (correo/contraseña) y enviar Token de Seguridad 2FA
 */
export const loginPrimerPaso = async (email, password) => {
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
    const fincaData = fincaDocSnap.data();

    // 4. Lógica de Bloqueo Estricto (Stripe)
    const urlParams = new URLSearchParams(window.location.search);
    const vieneDeStripe = urlParams.get('pago') === 'exitoso';

    if (fincaData.plan === "Pro" && fincaData.estado_suscripcion === "pendiente_pago" && !vieneDeStripe) {
      auth.signOut();
      throw new Error("Tu cuenta Pro está pendiente de pago. Completa la suscripción para acceder.");
    }

    // 5. GENERAR CÓDIGO DE VERIFICACIÓN 2FA (6 DÍGITOS)
    const codigoOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // Guardamos el código en Firestore (válido por 5 minutos)
    await updateDoc(userDocRef, {
      codigo2FA: codigoOTP,
      expiracion2FA: Date.now() + 300000
    });

    // 6. ENVIAR EL CORREO CON EMAILJS (CON TUS LLAVES REALES)
    const parametrosPlantilla = {
      to_email: email,
      to_name: userData.nombre || "Administrador",
      finca_nombre: fincaData.nombre,
      codigo_2fa: codigoOTP
    };

    try {
      await emailjs.send(
        "service_ejuml1o",      // Tu Service ID
        "template_79vga2i",     // Tu Template ID
        parametrosPlantilla,
        "voWjHjK7IiuJZpcKp"     // Tu Public Key
      );
      console.log(`✅ Correo enviado con éxito a ${email}`);
    } catch (errorEmail) {
      console.error("Error al despachar el correo de seguridad:", errorEmail);
      console.log(`🔑 Código de respaldo en consola: ${codigoOTP}`);
    }

    // 7. Retornar datos temporales (NO GUARDAMOS LA SESIÓN TODAVÍA)
    return {
      uid: user.uid,
      email: userData.email,
      role: userData.role,
      fincaId: fincaId,
      fincaNombre: fincaData.nombre,
      plan: fincaData.plan,
      token: user.accessToken
    };

  } catch (error) {
    console.error("Error en login:", error);
    if (error.code === 'auth/invalid-credential') {
      throw new Error("Credenciales incorrectas. Verifica tu correo y contraseña.", { cause: error });
    }
    throw new Error(error.message || "Error al iniciar sesión.", { cause: error });
  }
};

/**
 * FASE 2: Validar el código de 6 dígitos e iniciar la sesión definitiva
 */
export const verificarCodigo2FA = async (datosTemporales, codigoIngresado) => {
  const userDocRef = doc(db, "usuarios", datosTemporales.uid);
  const userDocSnap = await getDoc(userDocRef);
  const userData = userDocSnap.data();

  if (userData.codigo2FA !== codigoIngresado) {
    throw new Error("El código de verificación es incorrecto.");
  }

  if (Date.now() > userData.expiracion2FA) {
    throw new Error("El código de seguridad ha expirado. Solicita uno nuevo.");
  }

  // Limpieza del token para que no se pueda reusar
  await updateDoc(userDocRef, {
    codigo2FA: null,
    expiracion2FA: null
  });

  // Estructurar la sesión definitiva
  const sesionFinal = {
    ...datosTemporales,
    expiraEn: Date.now() + 3600000 
  };

  // AQUÍ ES DONDE FINALMENTE DAMOS ACCESO A LA APP
  localStorage.setItem("nutriporc_session", JSON.stringify(sesionFinal));
  return sesionFinal;
};