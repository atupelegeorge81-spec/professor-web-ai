# Mwongozo wa Utatuzi (Troubleshooting Guide) - OAuth Backend Error

Mwongozo huu unatoa ufumbuzi wa kina wa hitilafu (error) iliyoonekana kwenye picha ya skrini: `httpx.ConnectError: [Errno -3] Temporary failure in name resolution` wakati wa kujaribu kuingia kupitia Google OAuth (`GET /api/v1/auth/google/login`).

---

## 1. Shida ni Nini? (Root Cause)

Error hii inamaanisha kuwa **Server ya Backend (FastAPI)** inashindwa kuwasiliana na mitambo au server za Google (`accounts.google.com`) ili kupata taarifa za OAuth (metadata).

Sababu kuu ni **shida ya DNS (Domain Name Resolution)** kwenye mazingira (environment) ambapo backend yako inakimbizwa (running). Server inajaribu kutatua (resolve) jina la kikoa cha Google kuwa IP address lakini inashindwa kufanya hivyo, ambayo huleta kosa la:
`[Errno -3] Temporary failure in name resolution`

---

## 2. Ni kwa nini Haionekani Kwenye Codebase Hii?

Kama utakavyoona kwenye faili zilizomo kwenye repo hii:
* Hii ni **Frontend Repository** inayotumia static HTML, CSS, na JavaScript tu (kwa ajili ya Professor AI inayowasiliana na Groq API moja kwa moja kutoka kwenye browser).
* **Hakuna code ya backend (FastAPI/Python)** au mazingira ya seva kwenye repo hii.
* Error hiyo hutokea kwenye seva ya backend inayokimbiza api ya auth.

---

## 3. Jinsi ya Kurekebisha Shida Hii kwenye Seva ya Backend

Ili kutatua tatizo hili kwenye seva yako ya FastAPI, fuata hatua hizi kulingana na mazingira unayotumia:

### Mazingira ya Docker (Kama unatumia Docker/Docker Compose)
Mara nyingi Docker containers hukosa mawasiliano ya DNS au mtandao wa nje.
1. **Badilisha DNS za Docker daemon:**
   Weka DNS za umma za Google (`8.8.8.8` na `8.8.4.4`) kwenye `/etc/docker/daemon.json`:
   ```json
   {
     "dns": ["8.8.8.8", "8.8.4.4"]
   }
   ```
   Kisha anzisha upya Docker service:
   ```bash
   sudo systemctl restart docker
   ```
2. **Kwenye Docker Compose:**
   Unaweza kuongeza `dns` config kwenye huduma yako ya backend kwenye `docker-compose.yml`:
   ```yaml
   services:
     backend:
       image: my-fastapi-app
       dns:
         - 8.8.8.8
         - 8.8.4.4
   ```

### Mazingira ya Seva ya Kawaida (Linux / Ubuntu Virtual Machine)
1. **Hakiki Muunganisho wa Mtandao:**
   Ingia kwenye server yako kupitia SSH na ujaribu kupiga ping au curl kwenda Google:
   ```bash
   ping accounts.google.com
   # au
   curl -I https://accounts.google.com
   ```
2. **Hakiki faili ya `/etc/resolv.conf`:**
   Hakikisha una nameservers sahihi zilizowekwa. Unaweza kuongeza DNS ya Google kwa kuhariri faili hiyo:
   ```bash
   sudo nano /etc/resolv.conf
   ```
   Ongeza mistari ifuatayo:
   ```text
   nameserver 8.8.8.8
   nameserver 8.8.4.4
   ```

### Mazingira ya Kubernetes
Ikiwa unatumia Kubernetes:
1. Angalia kama CoreDNS inafanya kazi vizuri:
   ```bash
   kubectl get pods -n kube-system -l k8s-app=kube-dns
   ```
2. Hakikisha Pod ya FastAPI ina ruhusa ya kutoka nje ya mtandao (Egress/NetworkPolicy inaruhusu trafiki ya nje).
