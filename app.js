"use strict";

const DATA_URL = "./data/weapons.json";

let weapons = [];
let currentWeapon = null;
let currentCategory = "all";

const $ = id => document.getElementById(id);

const els = {
    status: $("dataStatus"),
    search: $("searchInput"),
    categoryList: $("categoryList"),
    weaponList: $("weaponList"),
    weaponCount: $("weaponCount"),

    loading: $("loading"),
    error: $("error"),
    errorText: $("errorText"),
    retry: $("retryButton"),
    view: $("weaponView"),

    image: $("weaponImage"),
    imageFallback: $("imageFallback"),
    category: $("weaponCategory"),
    name: $("weaponName"),
    english: $("weaponEnglish"),
    kit: $("weaponKit"),

    rangeEffective: $("rangeEffective"),
    rangePaint: $("rangePaint"),
    blastArea: $("blastArea"),
    blastCircle: $("blastCircle"),

    effectiveRange: $("effectiveRange"),
    paintRange: $("paintRange"),
    blastRange: $("blastRange"),

    maxDamage: $("maxDamage"),
    minDamage: $("minDamage"),
    damageFill: $("damageFill"),
    kills: $("kills"),
    fireRate: $("fireRate"),
    dps: $("dps"),

    falloffChart: $("falloffChart"),
    falloffNote: $("falloffNote"),

    blastPanel: $("blastPanel"),
    blastCircleBig: $("blastCircleBig"),
    directDamage: $("directDamage"),
    blastDamage: $("blastDamage"),
    blastRadius: $("blastRadius"),

    specifications: $("specifications"),
    wikiLink: $("wikiLink")
};


/* =========================
   初期化
========================= */

document.addEventListener("DOMContentLoaded", loadData);

async function loadData(){

    showLoading();

    try{

        const response = await fetch(
            DATA_URL + "?t=" + Date.now(),
            {
                cache:"no-store"
            }
        );

        if(!response.ok){
            throw new Error(
                "weapon-data.jsonを読み込めませんでした。"
            );
        }

        const data = await response.json();

        if(!Array.isArray(data.weapons)){
            throw new Error(
                "武器データの形式が正しくありません。"
            );
        }

        weapons = data.weapons;

        els.status.textContent =
            `DATA ${data.updated || "OK"}`;

        setupEvents();
        renderWeaponList();

        if(weapons.length > 0){
            selectWeapon(weapons[0].id);
        }else{
            throw new Error(
                "武器データが0件です。GitHub Actionsを実行してください。"
            );
        }

    }catch(error){

        console.error(error);

        showError(error.message);
    }
}


/* =========================
   イベント
========================= */

let eventsReady = false;

function setupEvents(){

    if(eventsReady) return;

    eventsReady = true;

    els.search.addEventListener(
        "input",
        renderWeaponList
    );

    els.categoryList
        .querySelectorAll(".category")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    currentCategory =
                        button.dataset.category;

                    els.categoryList
                        .querySelectorAll(".category")
                        .forEach(x =>
                            x.classList.remove("active")
                        );

                    button.classList.add("active");

                    renderWeaponList();
                }
            );

        });

    els.retry.addEventListener(
        "click",
        loadData
    );

}


/* =========================
   武器一覧
========================= */

function renderWeaponList(){

    const keyword =
        els.search.value
            .trim()
            .toLowerCase();

    const filtered = weapons.filter(weapon => {

        const categoryOK =
            currentCategory === "all" ||
            weapon.category === currentCategory;

        const nameOK =
            !keyword ||
            weapon.name.toLowerCase().includes(keyword) ||
            String(weapon.english || "")
                .toLowerCase()
                .includes(keyword);

        return categoryOK && nameOK;

    });

    els.weaponCount.textContent =
        filtered.length;

    els.weaponList.innerHTML = "";

    filtered.forEach(weapon => {

        const button =
            document.createElement("button");

        button.className =
            "weapon-item" +
            (
                currentWeapon &&
                currentWeapon.id === weapon.id
                    ? " active"
                    : ""
            );

        button.dataset.id = weapon.id;

        button.innerHTML = `
            <img
                class="weapon-thumb"
                src="${escapeAttribute(weapon.image || "")}"
                alt=""
                loading="lazy"
                onerror="this.style.visibility='hidden'"
            >

            <div class="weapon-item-name">
                <strong>${escapeHTML(weapon.name)}</strong>
                <span>${escapeHTML(weapon.category || "")}</span>
            </div>
        `;

        button.addEventListener(
            "click",
            () => selectWeapon(weapon.id)
        );

        els.weaponList.appendChild(button);

    });

}


/* =========================
   武器選択
========================= */

function selectWeapon(id){

    const weapon =
        weapons.find(x => x.id === id);

    if(!weapon) return;

    currentWeapon = weapon;

    renderWeaponList();
    renderWeapon(weapon);

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });
}


/* =========================
   武器表示
========================= */

function renderWeapon(w){

    els.view.classList.remove("hidden");
    els.loading.classList.add("hidden");
    els.error.classList.add("hidden");

    els.name.textContent =
        w.name || "Unknown";

    els.english.textContent =
        w.english || "";

    els.category.textContent =
        w.category || "";

    els.kit.textContent =
        buildKitText(w);

    if(w.image){

        els.image.src = w.image;
        els.image.classList.remove("hidden");
        els.imageFallback.classList.add("hidden");

    }else{

        els.image.removeAttribute("src");
        els.image.classList.add("hidden");
        els.imageFallback.classList.remove("hidden");

    }

    renderRange(w);
    renderDamage(w);
    renderBlast(w);
    renderSpecifications(w);
    renderFalloff(w);

    els.wikiLink.href =
        w.wikiUrl || "#";
}


/* =========================
   サブ・スペシャル
========================= */

function buildKitText(w){

    const values = [];

    if(w.sub){
        values.push("サブ: " + w.sub);
    }

    if(w.special){
        values.push("SP: " + w.special);
    }

    return values.join("  /  ");
}


/* =========================
   射程
========================= */

function renderRange(w){

    const effective =
        numberOrNull(w.effectiveRange);

    const paint =
        numberOrNull(w.paintRange);

    const blast =
        numberOrNull(w.blastRange);

    const maxRange = 6;

    setWidth(
        els.rangeEffective,
        effective,
        maxRange
    );

    setWidth(
        els.rangePaint,
        paint,
        maxRange
    );

    els.effectiveRange.textContent =
        formatNumber(effective);

    els.paintRange.textContent =
        formatNumber(paint);

    els.blastRange.textContent =
        formatNumber(blast);

    if(blast !== null){

        const percent =
            Math.min(
                100,
                Math.max(
                    0,
                    blast / maxRange * 100
                )
            );

        els.blastArea.style.left =
            percent + "%";

        const radius =
            numberOrNull(w.blastRadius);

        if(radius !== null){

            const px =
                Math.max(
                    16,
                    radius / maxRange * 520
                );

            els.blastCircle.style.width =
                px + "px";

            els.blastCircle.style.height =
                px + "px";

        }

    }else{

        els.blastArea.style.left = "-100px";

    }

}


/* =========================
   ダメージ
========================= */

function renderDamage(w){

    const max =
        numberOrNull(w.damageMax);

    const min =
        numberOrNull(w.damageMin);

    els.maxDamage.textContent =
        formatNumber(max);

    els.minDamage.textContent =
        formatNumber(min);

    const damagePercent =
        max === null
            ? 0
            : Math.min(
                100,
                max / 200 * 100
            );

    els.damageFill.style.width =
        damagePercent + "%";

    els.kills.textContent =
        w.kills || "--";

    els.fireRate.textContent =
        w.fireRate
            ? w.fireRate + "F"
            : "--";

    els.dps.textContent =
        w.dps !== null &&
        w.dps !== undefined
            ? formatNumber(w.dps)
            : "--";
}


/* =========================
   ブラスター
========================= */

function renderBlast(w){

    const hasBlast =
        w.blastRadius !== null &&
        w.blastRadius !== undefined;

    if(!hasBlast){

        els.blastPanel.classList.add("hidden");
        return;

    }

    els.blastPanel.classList.remove("hidden");

    els.directDamage.textContent =
        formatNumber(w.directDamage);

    els.blastDamage.textContent =
        formatNumber(w.blastDamage);

    els.blastRadius.textContent =
        formatNumber(w.blastRadius);

    if(w.blastRadius){

        const size =
            Math.max(
                40,
                Math.min(
                    220,
                    w.blastRadius * 120
                )
            );

        els.blastCircleBig.style.width =
            size + "px";

        els.blastCircleBig.style.height =
            size + "px";

    }

}


/* =========================
   詳細性能
========================= */

function renderSpecifications(w){

    const specs = [

        ["有効射程", value(w.effectiveRange)],
        ["確定数維持射程", value(w.maintainRange)],
        ["レティクル反応距離", value(w.reticleRange)],
        ["塗り射程", value(w.paintRange)],
        ["最大ダメージ", value(w.damageMax)],
        ["最小ダメージ", value(w.damageMin)],
        ["確定数", value(w.kills)],
        ["連射フレーム", suffix(w.fireRate,"F")],
        ["秒間発射数", suffix(w.shotsPerSecond,"発/秒")],
        ["キルタイム", suffix(w.killTime,"秒")],
        ["DPS", suffix(w.dps,"/秒")],
        ["射撃継続時間", suffix(w.fireDuration,"秒")],
        ["インク消費量", w.inkConsumption],
        ["装弾数", w.ammo],
        ["射撃中ヒト速", value(w.humanSpeed)],
        ["イカ速", value(w.swimSpeed)],
        ["単発塗りポイント", suffix(w.paintPoints,"p")]

    ];

    els.specifications.innerHTML = "";

    specs.forEach(([label,val]) => {

        if(
            val === "--" ||
            val === "" ||
            val === null ||
            val === undefined
        ){
            return;
        }

        const div =
            document.createElement("div");

        div.className = "spec";

        div.innerHTML = `
            <span>${escapeHTML(label)}</span>
            <strong>${escapeHTML(String(val))}</strong>
        `;

        els.specifications.appendChild(div);

    });

}


/* =========================
   減衰グラフ
========================= */

function renderFalloff(w){

    const svg =
        els.falloffChart;

    svg.innerHTML = "";

    const maxDamage =
        numberOrNull(w.damageMax);

    const minDamage =
        numberOrNull(w.damageMin);

    const start =
        numberOrNull(w.damageStartFrame);

    const end =
        numberOrNull(w.damageEndFrame);

    if(
        maxDamage === null ||
        minDamage === null ||
        start === null ||
        end === null ||
        end <= start
    ){

        drawSimpleGraph(
            svg,
            maxDamage,
            minDamage
        );

        els.falloffNote.textContent =
            "Wikiに掲載されている最大・最小ダメージを表示しています。";

        return;
    }

    const W = 700;
    const H = 300;

    const pad = {
        left:55,
        right:20,
        top:20,
        bottom:40
    };

    const graphW =
        W - pad.left - pad.right;

    const graphH =
        H - pad.top - pad.bottom;

    const x1 = pad.left;
    const y1 =
        pad.top +
        graphH -
        (maxDamage / Math.max(100,maxDamage) * graphH);

    const x2 =
        pad.left +
        graphW;

    const y2 =
        pad.top +
        graphH -
        (minDamage / Math.max(100,maxDamage) * graphH);

    const axis =
        createSVG("path",{
            d:`M ${pad.left} ${pad.top}
               V ${pad.top+graphH}
               H ${W-pad.right}`,
            fill:"none",
            stroke:"#3b414a",
            "stroke-width":"2"
        });

    svg.appendChild(axis);

    const line =
        createSVG("path",{
            d:`M ${x1} ${y1}
               L ${x2} ${y2}`,
            fill:"none",
            stroke:"#d8ff3e",
            "stroke-width":"5",
            "stroke-linecap":"round"
        });

    svg.appendChild(line);

    const p1 =
        createSVG("circle",{
            cx:x1,
            cy:y1,
            r:7,
            fill:"#d8ff3e"
        });

    const p2 =
        createSVG("circle",{
            cx:x2,
            cy:y2,
            r:7,
            fill:"#ff5d6c"
        });

    svg.appendChild(p1);
    svg.appendChild(p2);

    addText(
        svg,
        x1,
        y1 - 12,
        maxDamage,
        "start"
    );

    addText(
        svg,
        x2,
        y2 - 12,
        minDamage,
        "end"
    );

    addText(
        svg,
        x1,
        H - 15,
        start + "F",
        "start"
    );

    addText(
        svg,
        x2,
        H - 15,
        end + "F",
        "end"
    );

    els.falloffNote.textContent =
        `ダメージ減衰: ${start}F → ${end}F`;

}


/* =========================
   単純グラフ
========================= */

function drawSimpleGraph(svg,max,min){

    if(max === null || min === null){
        return;
    }

    const W = 700;
    const H = 300;

    const path =
        createSVG("path",{
            d:`M 55 40 L 680 220`,
            fill:"none",
            stroke:"#d8ff3e",
            "stroke-width":"5",
            "stroke-linecap":"round"
        });

    svg.appendChild(path);

    addText(svg,55,30,max,"start");
    addText(svg,680,210,min,"end");
}


/* =========================
   SVG
========================= */

function createSVG(tag,attrs){

    const element =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            tag
        );

    Object.entries(attrs).forEach(
        ([key,value]) =>
            element.setAttribute(key,value)
    );

    return element;
}

function addText(svg,x,y,text,anchor){

    const element =
        createSVG("text",{
            x,
            y,
            fill:"#f4f5f7",
            "font-size":"14",
            "text-anchor":anchor
        });

    element.textContent = text;

    svg.appendChild(element);
}


/* =========================
   状態
========================= */

function showLoading(){

    els.loading.classList.remove("hidden");
    els.error.classList.add("hidden");
    els.view.classList.add("hidden");

}

function showError(message){

    els.loading.classList.add("hidden");
    els.view.classList.add("hidden");
    els.error.classList.remove("hidden");

    els.errorText.textContent =
        message ||
        "データを読み込めませんでした。";

    els.status.textContent =
        "DATA ERROR";
}


/* =========================
   Helpers
========================= */

function numberOrNull(value){

    if(
        value === null ||
        value === undefined ||
        value === ""
    ){
        return null;
    }

    const n =
        parseFloat(
            String(value)
                .replace(/,/g,"")
                .replace(/[^\d.+-]/g,"")
        );

    return Number.isFinite(n)
        ? n
        : null;
}

function formatNumber(value){

    const n =
        numberOrNull(value);

    if(n === null){
        return "--";
    }

    return Number.isInteger(n)
        ? String(n)
        : n.toFixed(2)
            .replace(/0+$/,"")
            .replace(/\.$/,"");
}

function value(v){

    return v === null ||
           v === undefined ||
           v === ""
        ? "--"
        : formatNumber(v);
}

function suffix(v,s){

    if(
        v === null ||
        v === undefined ||
        v === ""
    ){
        return "--";
    }

    return formatNumber(v) + s;
}

function setWidth(element,value,max){

    if(value === null){

        element.style.width = "0%";
        return;

    }

    const percent =
        Math.min(
            100,
            Math.max(
                0,
                value / max * 100
            )
        );

    element.style.width =
        percent + "%";
}

function escapeHTML(value){

    return String(value)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

function escapeAttribute(value){

    return escapeHTML(value);
}
