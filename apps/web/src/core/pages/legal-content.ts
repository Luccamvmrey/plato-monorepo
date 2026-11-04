export interface LegalDocument {
    title: string;
    updatedAt: string;
    sections: { heading: string; paragraphs: string[] }[];
}

export const CONTACT_EMAIL = "luccamvmachadorey@gmail.com";

const UPDATED_AT = "3 de novembro de 2026";

export const TERMS: LegalDocument = {
    title: "Termos de Uso",
    updatedAt: UPDATED_AT,
    sections: [
        {
            heading: "O serviço",
            paragraphs: [
                "O Plato é um aplicativo para planejar treinos, registrar sessões e acompanhar a evolução de carga. Ele está em fase de testes (beta): funcionalidades podem mudar, falhar ou sair do ar, e o uso é gratuito neste momento.",
            ],
        },
        {
            heading: "Sua conta",
            paragraphs: [
                "Para usar o Plato, você precisa ter 18 anos ou mais e informar um e-mail válido. Você é responsável por manter sua senha em segurança e pelo que for feito na sua conta.",
                "Você pode exportar seus dados ou apagar sua conta a qualquer momento na tela de perfil.",
            ],
        },
        {
            heading: "Saúde e segurança",
            paragraphs: [
                "O Plato não oferece orientação médica nem substitui um profissional de educação física ou de saúde. As sugestões de carga são cálculos automáticos baseados no que você registra e podem não ser adequadas ao seu caso.",
                "Treine dentro dos seus limites e procure um profissional antes de começar ou mudar sua rotina, especialmente se tiver alguma condição de saúde. Pare se sentir dor ou mal-estar.",
            ],
        },
        {
            heading: "Uso permitido",
            paragraphs: [
                "Não use o Plato para violar a lei, acessar dados de outras pessoas, atacar ou sobrecarregar o serviço. Podemos suspender contas que façam isso.",
            ],
        },
        {
            heading: "Limites de responsabilidade",
            paragraphs: [
                "O serviço é oferecido como está, sem garantia de disponibilidade contínua ou de que nenhum dado será perdido. Recomendamos exportar seus dados periodicamente. Nada aqui afasta direitos que a lei garante a você e não possam ser renunciados.",
            ],
        },
        {
            heading: "Mudanças e contato",
            paragraphs: [
                "Podemos atualizar estes termos e avisaremos sobre mudanças relevantes. Estes termos seguem a lei brasileira.",
                `Dúvidas: ${CONTACT_EMAIL}.`,
            ],
        },
    ],
};

export const PRIVACY: LegalDocument = {
    title: "Política de Privacidade",
    updatedAt: "4 de novembro de 2026",
    sections: [
        {
            heading: "Dados que coletamos",
            paragraphs: [
                "Conta: nome, e-mail e senha, guardada apenas em formato criptografado (hash).",
                "Treino: treinos e programas criados, séries, cargas, repetições, percepção de esforço, observações e recordes.",
                "Peso corporal: os registros que você decidir incluir. Esse dado pode ser considerado sensível por se relacionar à sua saúde.",
                "Não usamos cookies de publicidade nem ferramentas de rastreamento de terceiros. O aplicativo guarda no seu aparelho apenas o necessário para manter você conectado e preservar o treino em andamento.",
            ],
        },
        {
            heading: "Para que usamos",
            paragraphs: [
                "Para manter sua conta, mostrar seu histórico e calcular progressão e recordes, com base na execução do serviço que você contratou e no seu consentimento para os dados de peso corporal e treino.",
                "Para enviar e-mails necessários, como a redefinição de senha.",
                "Para medir o uso do produto de forma agregada, como número de cadastros e de treinos concluídos.",
                "Não vendemos seus dados e não os usamos para publicidade.",
            ],
        },
        {
            heading: "Com quem compartilhamos",
            paragraphs: [
                "Apenas com fornecedores necessários para operar o Plato: Supabase (banco de dados), Vultr (servidor) e Resend (envio de e-mails). Alguns deles podem tratar dados fora do Brasil.",
                "Se você criar um link de compartilhamento, o conteúdo descrito na seção abaixo fica acessível a quem tiver o link.",
            ],
        },
        {
            heading: "Links de compartilhamento",
            paragraphs: [
                "Criar um link é uma escolha sua. Qualquer pessoa com o link, mesmo sem conta, vê o nome e a descrição do treino ou programa, os exercícios, as séries, as repetições e as observações. Seu nome e seu e-mail não aparecem. Evite colocar informações pessoais nesses campos.",
                "O link mostra o conteúdo do momento em que foi criado. Você pode desativá-lo em Perfil > Configurações, e ele também deixa de funcionar quando a conta é apagada. Quem já adicionou o treino ou programa fica com a própria cópia, mesmo depois disso.",
                "Contamos quantas vezes cada link foi aberto e adicionado, e registramos na conta nova o link que levou ao cadastro, para medir o uso do recurso.",
            ],
        },
        {
            heading: "Por quanto tempo guardamos",
            paragraphs: [
                "Enquanto sua conta existir. Ao apagar a conta, seus dados são removidos do banco de dados ativo, exceto cópias de segurança temporárias e o que a lei exigir manter.",
            ],
        },
        {
            heading: "Seus direitos",
            paragraphs: [
                "Pela Lei Geral de Proteção de Dados (LGPD), você pode confirmar e acessar seus dados, corrigi-los, exportá-los, pedir a exclusão e revogar o consentimento.",
                `A exportação e a exclusão estão na tela de perfil. Para o resto, escreva para ${CONTACT_EMAIL}.`,
            ],
        },
        {
            heading: "Segurança e mudanças",
            paragraphs: [
                "Usamos medidas como senhas em hash e sessões com validade, mas nenhum sistema é totalmente seguro. Se esta política mudar de forma relevante, avisaremos.",
            ],
        },
    ],
};
