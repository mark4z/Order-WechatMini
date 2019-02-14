from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
import json
from . import redis


class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        cache_list = json.loads(message)

        desk = int(self.scope['url_route']['kwargs']['room_name'])

        # 处理请求
        if cache_list['action'] == "+":
            redis.set_cache(cache_list['detail'])
        if cache_list['action'] == "-":
            redis.del_cache(cache_list['detail'])
        if cache_list['action'] == "*":
            redis.clean_cache(desk)

        # Send message to room group
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': redis.get_cache(desk)
            }
        )

    # Receive message from room group
    def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'message': json.dumps(message)
        }))
