import{u as d,b as u,r as s,j as r,f as c}from"./index-gTc9NsbL.js";import{c as b}from"./bookUtils-CgM2oPgX.js";import{M as f}from"./MCQBookPage-C-rITxtu.js";import"./CheckmarkIcon-DE2tmorL.js";const y=()=>{const{docId:i}=d(),[e]=u(),[a,p]=s.useState(null),l=s.useMemo(()=>({paperSize:e.get("paper")||"A4",perColumn:Number(e.get("perCol"))||5,density:e.get("density")||"dense",fontStep:Number(e.get("fontStep"))||15,optionStyle:e.get("optionStyle")||"english",fontStyle:e.get("fontStyle")||"classic",showExplanations:e.get("showExplanations")==="true",showAnswerInMCQ:e.get("showAnswerInMCQ")!=="false",theme:e.get("theme")||"classic",borderStyle:e.get("borderStyle")||"solid",lineSpacing:e.get("lineSpacing")||"normal",margins:{preset:"normal",top:Number(e.get("marginTop"))||8,bottom:Number(e.get("marginBottom"))||8,left:Number(e.get("marginLeft"))||8,right:Number(e.get("marginRight"))||8},watermark:{enabled:!1,text:"",style:"diagonal",position:"center",fontSize:"large",opacity:15,color:"#9ca3af"}}),[e]);if(s.useEffect(()=>{(async()=>{if(i){const n=await c.getById(i);p(n||null)}})()},[i]),!a)return r.jsxDEV("div",{children:"Loading document..."},void 0,!1,{fileName:"/app/applet/features/print/PrintPage.tsx",lineNumber:52,columnNumber:20},void 0);const o={...a.settings,...l},{pages:m}=b(a.mcqs,o,a.mergedFrom);return r.jsxDEV("div",{className:"print-root",children:[r.jsxDEV("style",{children:`
        @page {
          size: ${o.paperSize};
          margin: 0;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white;
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }
          .page-break {
            page-break-after: always;
            page-break-inside: avoid;
            /* Allow content flow */
          }
          .print-root {
             width: 100%;
          }
        }
        /* Hide scrollbars during print */
        ::-webkit-scrollbar { display: none; }
        
        body { margin: 0; padding: 0; background: #555; }
        .print-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
        }
        .print-page-wrapper {
           margin-bottom: 20px;
           box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
           background: white;
        }
        
        @media print {
           body { background: white; }
           .print-root { display: block; padding: 0; }
           .print-page-wrapper { margin: 0; box-shadow: none; margin-bottom: 0; }
        }
      `},void 0,!1,{fileName:"/app/applet/features/print/PrintPage.tsx",lineNumber:64,columnNumber:7},void 0),m.map(t=>{var n;return r.jsxDEV("div",{className:"print-page-wrapper page-break",children:r.jsxDEV(f,{page:t,settings:t.settings||o,pageNumber:t.pageNumber,pageSetting:(n=a.pageSettings)==null?void 0:n.find(g=>g.pageNumber===t.pageNumber)},void 0,!1,{fileName:"/app/applet/features/print/PrintPage.tsx",lineNumber:113,columnNumber:13},void 0)},t.pageNumber,!1,{fileName:"/app/applet/features/print/PrintPage.tsx",lineNumber:112,columnNumber:9},void 0)})]},void 0,!0,{fileName:"/app/applet/features/print/PrintPage.tsx",lineNumber:63,columnNumber:5},void 0)};export{y as default};
